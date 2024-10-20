# Description

Provide actor metadata via async local storage to descendants.
The goal of this package is to avoid passing data such as trace id from function to function.

# Setup

```js
// By first we need to bind actor to async context
app.use((ctx, next) => {
	return withServiceActor(
		{
			traceId: ctx.headers['x-request-id'],
			ipAddress: ctx.headers['x-forwarded-for'],
		},
		next,
	);
});
```

# Usage

```js
/**
 * Returns service actor instance from async context
 * Useful in controllers where we know for sure that the actor was initialized by middleware above
 */
app.patch('/users/:id', (ctx) => {
	const actor = injectServiceActor();
	const data = ctx.request.body;
	const accountId = ctx.params.id;

	await UserService.updateById(accountId, data);

	ctx.body = 'ok';
});

/**
 * Returns service actor instance from async context or create and bind to async context
 * Useful in service logic where we can initialize actor with some default values
 * in case the function could potentially be run outside of context.
 */
class UserService {
	static async updateById(accountId, data) {
		// In case the actor has not been initialized before, we will get the trace id generation
		// and actor providing to descendants here
		const actor = useServiceActor({
			actorType: 'service',
		});

		log.info('Update user by id', { accountId, data, ...actor.retrieve() });

		await db.users.updateOne({ _id: accountId }, data);
	}
}
```
