# Firestore Security Rules Documentation

## Overview

Cleo-Aura-Fitness uses Firestore Security Rules to enforce Role-Based Access Control (RBAC) and data ownership without requiring a backend server. This document explains the security model, rule structure, and testing strategy.

## Security Model

### Core Principles

1. **Trainee-Owned Data**: All user data belongs to the trainee and is stored under their UID
2. **Deny by Default**: All access is denied unless explicitly allowed
3. **No Deletion**: Users cannot delete their own data (admin-only operation)
4. **Authentication Required**: All operations require a valid authenticated user

### Role Hierarchy

| Role | Access Level | Permissions |
|------|-------------|-------------|
| Trainee | Owner | Full read/write access to own data |
| Trainer | Read-only* | Access via grants (Milestone 5+) |
| Nutritionist | Read-only* | Access via grants (Milestone 5+) |
| Counsellor | Read-only* | Access via grants (Milestone 5+) |

*Professional access will be implemented in Milestone 5

## Rule Structure

### Helper Functions

#### `isSignedIn()`
Checks if the user is authenticated.

```javascript
function isSignedIn() {
  return request.auth != null;
}
```

#### `isOwner(uid)`
Checks if the authenticated user owns the resource by matching their UID.

```javascript
function isOwner(uid) {
  return isSignedIn() && request.auth.uid == uid;
}
```

#### `isTraineeOwner(traineeId)`
Specialized helper for trainee data ownership. Ensures the authenticated user is the trainee owner.

```javascript
function isTraineeOwner(traineeId) {
  return isSignedIn() && request.auth.uid == traineeId;
}
```

## Collection Rules

### Users Collection (`users/{userId}`)

**Purpose**: Stores user profiles including email, display name, role, and metadata.

**Rules**:
- ✅ Users can **read** their own profile
- ✅ Users can **create** their own profile
- ✅ Users can **update** their own profile
- ❌ Users **cannot delete** their profile
- ❌ Users **cannot access** other users' profiles

**Example Document**:
```json
{
  "uid": "user123",
  "email": "jane@example.com",
  "displayName": "Jane Doe",
  "role": "trainee",
  "status": "active",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Trainees Collection (`trainees/{traineeId}`)

**Purpose**: Stores trainee-specific data and serves as the root for all tracking subcollections.

**Rules**:
- ✅ Trainees can **read** their own data
- ✅ Trainees can **create** their own data
- ✅ Trainees can **update** their own data
- ❌ Trainees **cannot delete** their data
- ❌ Trainees **cannot access** other trainees' data

**Example Document**:
```json
{
  "uid": "trainee123",
  "ownerId": "trainee123",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Trainee Subcollections

**Purpose**: Store all tracking data (workouts, recovery, nutrition, wellbeing, etc.).

**Collections**:
- `trainees/{traineeId}/workouts/{workoutId}`
- `trainees/{traineeId}/recovery/{recoveryId}`
- `trainees/{traineeId}/nutritionDays/{yyyyMMdd}`
- `trainees/{traineeId}/wellbeingDays/{yyyyMMdd}`
- `trainees/{traineeId}/progressMeasurements/{measurementId}`
- `trainees/{traineeId}/wearablesSummary/{yyyyMMdd}`

**Rules**:
- ✅ Trainees can **read and write** all their subcollections
- ❌ Trainees **cannot access** other trainees' subcollections
- ❌ Unauthenticated users have **no access**

## Testing Strategy

### Test Coverage

Firestore Security Rules are tested using the Firebase Emulator Suite with the `@firebase/rules-unit-testing` package.

### Test Categories

1. **Trainee Access Success Cases**
   - Trainee can read own profile
   - Trainee can create own profile
   - Trainee can update own profile
   - Trainee can read own trainee data
   - Trainee can read/write own workouts

2. **Unauthorized Access Failure Cases**
   - Users cannot read other users' profiles
   - Users cannot create profiles for others
   - Users cannot update other users' profiles
   - Users cannot delete their own profiles
   - Trainees cannot access other trainees' data
   - Unauthenticated users are denied all access

### Running Tests

```bash
# Start Firestore Emulator
pnpm test:rules

# The tests will automatically:
# 1. Start the Firestore Emulator on port 8080
# 2. Load firestore.rules
# 3. Run all test cases
# 4. Clean up after completion
```

### Test File Location

- **Test file**: `firestore.test.ts`
- **Rules file**: `firestore.rules`
- **Emulator config**: `firebase.json`

## Future Enhancements (Milestone 5+)

### Professional Access via Grants

When implementing Milestone 5 (Team Members & Permissions), the rules will be enhanced to support:

1. **Grant-based access**: Professionals can read trainee data based on explicit grants
2. **Module-level permissions**: Granular control over which data modules professionals can access
3. **Read-only enforcement**: Professionals can never write to trainee data
4. **Instant revocation**: Trainee can revoke access at any time

**Example future rule structure**:
```javascript
function hasGrant(traineeId, module) {
  let grantDoc = get(/databases/$(database)/documents/trainees/$(traineeId)/grants/$(request.auth.uid));
  return grantDoc != null && grantDoc.data.modules[module] == true;
}

// Professional read access to workouts (if granted)
match /trainees/{traineeId}/workouts/{workoutId} {
  allow read: if isTraineeOwner(traineeId) || hasGrant(traineeId, 'workouts');
  allow write: if isTraineeOwner(traineeId);
}
```

## Security Considerations

### Current Protections

✅ **Authentication Required**: All operations require Firebase Authentication
✅ **Data Isolation**: Users can only access their own data
✅ **No Deletion**: Prevents accidental data loss
✅ **Deny by Default**: Unknown collections are automatically denied

### Known Limitations (to be addressed in later milestones)

⚠️ **No professional access yet**: Trainers, nutritionists, and counsellors cannot view trainee data (Milestone 5)
⚠️ **No team collaboration**: Multiple professionals cannot coordinate (Milestone 6)
⚠️ **No audit logs**: No tracking of who accessed what data (Future enhancement)

## Compliance & Privacy

### GDPR Compliance

- **Data Minimization**: Only necessary data is collected
- **User Control**: Trainees own and control all their data
- **Right to Access**: Users can read all their data
- **Right to Rectification**: Users can update their data
- **Right to Deletion**: Will be implemented via admin tools (not self-service to prevent accidental deletion)

### Data Encryption

- **At Rest**: Firestore encrypts all data at rest by default (AES-256)
- **In Transit**: All connections use TLS 1.2+ encryption
- **Client SDK**: Firebase SDKs enforce secure connections

## Troubleshooting

### Common Issues

**Issue**: "Missing or insufficient permissions" error
**Solution**: Verify the user is authenticated and accessing their own data (uid matches)

**Issue**: Tests failing with permission denied
**Solution**: Ensure Firestore Emulator is running on port 8080

**Issue**: Rule changes not applying
**Solution**: Redeploy rules with `firebase deploy --only firestore:rules`

## References

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Rules Unit Testing Guide](https://firebase.google.com/docs/rules/unit-tests)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)

---

**Last Updated**: Milestone 2
**Version**: 1.0.0
**Maintained By**: Cleo-Aura-Fitness Development Team
