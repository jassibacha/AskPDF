### This guide is updated as of Jan 10, 2023.

Note: To be able to build this app exactly as intended, you can use Josh's [`pnmp-lock.yaml` file](https://github.com/joschan21/quill/blob/master/pnpm-lock.yaml) to get his exact versions of all node_modules. 

If you want to build using more recent/up-to-date modules, you can follow along here.

## Creating Our Dashboard [[1:27:12](https://www.youtube.com/watch?v=ucX2zXAZ1I0&t=5233s)]
### Changes to Kinde's `getUser()`


Any and all uses of Kinde's `getUser()` are a bit different, they require `await` in the newest version [[info here](https://kinde.com/docs/developer-tools/nextjs-sdk/#migration-guide)]

```jsx
BEFORE: 
const user = getUser()

NEW VERSION:
const user = await getUser()
```

By [2:18:29](https://www.youtube.com/watch?v=ucX2zXAZ1I0&t=8309s) I had to add `await getUser()` on:
- `src/app/dashboard/page.tsx` - come back and link these later
- `src/trpc/index.ts` - come back and link these later
- [2:44:58] `src/trpc/trpc.ts` 


Note: This also means you need to update certain functions like `src/app/dashboard/page.tsx` to `async` when you call await inside.