# MongoDB Best Practices - Preventing Common Errors

## ⚠️ Critical: Avoiding "ConflictingUpdateOperators" Error

### The Problem

MongoDB throws error **code 40 "ConflictingUpdateOperators"** when you try to update the same field in both:
1. The filter condition (query)
2. The `$set` or `$setOnInsert` operators

### Common Scenario

```typescript
// ❌ WRONG - This will cause conflict!
db.collection.findOneAndUpdate(
  { orgId: "default" },  // orgId in filter
  {
    $set: {
      orgId: "default",  // ❌ orgId in $set - CONFLICT!
      name: "John",
      ...otherData
    },
    $setOnInsert: {
      createdAt: new Date()
    }
  },
  { upsert: true }
);
```

**Error:**
```
MongoServerError: Updating the path 'orgId' would create a conflict at 'orgId'
code: 40,
codeName: 'ConflictingUpdateOperators'
```

### ✅ The Solution

**Always exclude filter fields from update data:**

```typescript
// ✅ CORRECT - Remove filter fields from data
export async function upsertDocument(orgId: string, data: Partial<Document>) {
  const db = await getDb();
  
  // Remove orgId from data to avoid conflict
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { orgId: _, ...updateData } = data;
  
  return db.collection('documents').findOneAndUpdate(
    { orgId },  // Filter by orgId
    {
      $set: {
        ...updateData,  // Only spread fields NOT in filter
        updatedAt: new Date(),
      },
      $setOnInsert: {
        orgId,  // Only set on insert
        createdAt: new Date(),
      },
    },
    { upsert: true, returnDocument: 'after' }
  );
}
```

### Rule of Thumb

**If a field is in the filter, it MUST NOT be in `$set`**

Fields used in the query should only appear in `$setOnInsert` (for new documents only).

---

## 📋 Checklist for All Upsert Operations

When writing `findOneAndUpdate` with `upsert: true`:

- [ ] Identify all fields used in the filter/query
- [ ] Use destructuring to remove those fields from update data
- [ ] Put filter fields ONLY in `$setOnInsert`
- [ ] Put all other data in `$set`
- [ ] Always add `updatedAt` in `$set`
- [ ] Always add `createdAt` in `$setOnInsert`

---

## 🔧 Standard Upsert Pattern

### Single Filter Field

```typescript
export async function upsertByEmail(email: string, data: Partial<User>) {
  const db = await getDb();
  
  // Remove filter field from data
  const { email: _, ...updateData } = data;
  
  return db.collection<User>('users').findOneAndUpdate(
    { email },  // Filter
    {
      $set: {
        ...updateData,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        email,  // Only on insert
        createdAt: new Date(),
      },
    },
    { upsert: true, returnDocument: 'after' }
  );
}
```

### Multiple Filter Fields (Compound Key)

```typescript
export async function upsertLead(orgId: string, personId: string, data: Partial<Lead>) {
  const db = await getDb();
  
  // Remove ALL filter fields from data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { orgId: _, personId: __, ...updateData } = data;
  
  return db.collection<Lead>('leads').findOneAndUpdate(
    { orgId, personId },  // Compound filter
    {
      $set: {
        ...updateData,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        orgId,      // Only on insert
        personId,   // Only on insert
        createdAt: new Date(),
      },
    },
    { upsert: true, returnDocument: 'after' }
  );
}
```

---

## 🚨 Fixed Issues in This Project

### 1. `models/Lead.ts` - `upsertLead()`
**Fixed:** Removed `orgId` and `personId` from `$set` operation

### 2. `models/RocketReachSettings.ts` - `upsertRocketReachSettings()`
**Fixed:** Removed `orgId` from `$set` operation

---

## 📝 Code Review Checklist

When reviewing upsert code, check for:

1. **Filter Field Conflicts**
   ```typescript
   // Look for this pattern:
   .findOneAndUpdate(
     { fieldA: value },  // ← Check what's here
     {
       $set: {
         fieldA: ...  // ← Should NOT be here!
       }
     }
   )
   ```

2. **Spread Operator Issues**
   ```typescript
   // ❌ WRONG - data might contain filter fields
   $set: { ...data }
   
   // ✅ CORRECT - filter fields removed
   const { filterId: _, ...updateData } = data;
   $set: { ...updateData }
   ```

3. **Missing Field Removal**
   ```typescript
   // If you see this pattern, it's likely wrong:
   function upsert(id: string, data: Partial<T>) {
     return db.collection.findOneAndUpdate(
       { id },
       { $set: data }  // ❌ Should remove 'id' from data first!
     );
   }
   ```

---

## 🎯 Quick Fix Template

If you encounter the error:

```typescript
// 1. Find the function causing the error
export async function upsertSomething(key: string, data: Partial<Type>) {
  
  // 2. Add this line to remove filter field(s)
  const { key: _, ...updateData } = data;
  
  // 3. Replace data with updateData in $set
  return db.collection.findOneAndUpdate(
    { key },
    {
      $set: {
        ...updateData,  // Changed from: ...data
        updatedAt: new Date(),
      },
      $setOnInsert: {
        key,  // Add filter field here
        createdAt: new Date(),
      },
    },
    { upsert: true, returnDocument: 'after' }
  );
}
```

---

## 🔍 Other MongoDB Anti-Patterns to Avoid

### 1. Don't Mix `$set` and Field Updates
```typescript
// ❌ WRONG
{
  $set: { name: "John" },
  age: 30  // This won't work
}

// ✅ CORRECT
{
  $set: { name: "John", age: 30 }
}
```

### 2. Don't Update `_id`
```typescript
// ❌ WRONG - _id is immutable
{
  $set: { _id: new ObjectId(), name: "John" }
}

// ✅ CORRECT
{
  $set: { name: "John" }
}
```

### 3. Don't Use `$setOnInsert` Without `upsert: true`
```typescript
// ❌ WRONG - $setOnInsert has no effect
db.collection.updateOne(
  { id },
  { $setOnInsert: { createdAt: new Date() } }
  // Missing: { upsert: true }
);

// ✅ CORRECT
db.collection.updateOne(
  { id },
  { $setOnInsert: { createdAt: new Date() } },
  { upsert: true }
);
```

---

## 📚 Resources

- [MongoDB Update Operators](https://docs.mongodb.com/manual/reference/operator/update/)
- [findOneAndUpdate Documentation](https://docs.mongodb.com/manual/reference/method/db.collection.findOneAndUpdate/)
- [Upsert Behavior](https://docs.mongodb.com/manual/reference/method/db.collection.update/#upsert-behavior)

---

**Last Updated:** November 8, 2025  
**Status:** All upsert functions in the project have been audited and fixed ✅
