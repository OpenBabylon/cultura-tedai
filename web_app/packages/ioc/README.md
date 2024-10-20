# Description

IOC Container

# Setup

Before running actual code, you need to setup service container.
This example will auto-import all `*.service.js` files from path service folders.

```js
import { ServiceContainer } from '@cultura-ai/ioc';

await ServiceContainer.setup({
	pathRoot: process.cwd(),
	autoImportPatterns: ['./services/*/**/*.service.{js,mjs}'],
	typeOutput: './ioc.d.ts',
	generateTypes: true,
});

// your code
```

# Usage

```js
// user.service.ts
import { ServiceContainer } from '@cultura-ai/ioc';

export class UserService {
	async create() {
		// TODO
	}
}

ServiceContainer.set('UserService', UserService);
```

```js
// user.controller.js
import { ioc } from '@cultura-ai/ioc';

export function createUser() {
	const UserService = ioc('UserService');

	ctx.body = await UserService.create(ctx.request.body);
}
```
