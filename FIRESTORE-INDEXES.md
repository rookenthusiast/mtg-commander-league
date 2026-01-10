# Firestore Indexes Required

This document lists the Firestore composite indexes required for the MTG Commander League application.

## Required Indexes

### 1. DeckVersions Cleanup Query

**Collection:** `deckVersions`

**Fields:**
- `deckId` (Ascending)
- `versionNumber` (Descending)

**Purpose:** Used by the `cleanupOldVersions` function to retrieve deck versions ordered by version number for cleanup operations.

**How to Create:**

#### Option 1: Use the Auto-Generated Link
When you see the error in logs, it will include a link like:
```
https://console.firebase.google.com/v1/r/project/YOUR_PROJECT/firestore/indexes?create_composite=...
```

Click this link and Firebase Console will automatically create the index for you.

#### Option 2: Manual Creation via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes** tab
4. Click **Create Index**
5. Configure the index:
   - **Collection ID:** `deckVersions`
   - **Fields to index:**
     - Field: `deckId`, Order: `Ascending`
     - Field: `versionNumber`, Order: `Descending`
   - **Query scopes:** Collection
6. Click **Create**

The index will take a few minutes to build. Once it's ready, the cleanup operations will work without errors.

#### Option 3: Use Firebase CLI

Create a `firestore.indexes.json` file in your project root:

```json
{
  "indexes": [
    {
      "collectionGroup": "deckVersions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "deckId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "versionNumber",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy the index:
```bash
firebase deploy --only firestore:indexes
```

## Notes

- The cleanup function is now **non-blocking**, so the application will continue to work even if this index hasn't been created yet
- Without the index, you'll see warnings in logs but price updates will still succeed
- Old deck versions will accumulate until the index is created, but this won't affect functionality
- Once the index is created, cleanup will happen automatically on future price updates
