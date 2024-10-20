<script lang="ts" setup>
import { toTypedSchema } from '@vee-validate/zod';
import { Field as FormField, useForm } from 'vee-validate';
import { z } from 'zod';

definePage({
	meta: {
		layout: 'LayoutDefaultCenter',
	},
});

const formSchema = toTypedSchema(
	z.object({
		email: z.string().email(),
		password: z.string(),
	}),
);

const { handleSubmit, resetForm } = useForm({
	validationSchema: formSchema,
});

const onSubmit = handleSubmit((values) => {
	console.info('submit login form', { values });
	resetForm();
});
</script>

<template>
	<VCard class="sm:w-full sm:max-w-sm">
		<VCardHeader>
			<VCardTitle>Авторизація</VCardTitle>
			<VCardDescription>Для входу в особистий кабінет введіть свої дані.</VCardDescription>
		</VCardHeader>
		<VCardContent>
			<form class="space-y-6" @submit="onSubmit">
				<FormField v-slot="{ componentField }" name="email">
					<VFormItem v-auto-animate>
						<VFormLabel>Логін</VFormLabel>
						<VFormControl>
							<VInput type="text" placeholder="Логін" v-bind="componentField" />
						</VFormControl>
						<VFormMessage />
					</VFormItem>
				</FormField>

				<FormField v-slot="{ componentField }" name="password">
					<VFormItem v-auto-animate>
						<VFormLabel>Пароль</VFormLabel>
						<VFormControl>
							<VInput type="password" placeholder="Пароль" v-bind="componentField" />
						</VFormControl>
						<VFormMessage />
					</VFormItem>
				</FormField>

				<div class="w-full">
					<VButton type="submit" class="w-full" text="Увійти" />
				</div>
			</form>
		</VCardContent>
	</VCard>

	<div class="text-sm pt-4">
		<RouterLink class="underline underline-offset-4 decoration-foreground" to="/reset-password"
			>Забули пароль?</RouterLink
		>
	</div>
</template>
