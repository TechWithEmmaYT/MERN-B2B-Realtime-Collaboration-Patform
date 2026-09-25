import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { AuthLayout } from '@/layouts/auth-layout'
import { CURRENT_USER_QUERY_KEY } from '@/context/auth-context'
import { GoogleButton } from '@/components/auth/google-button'
import { PasswordInput } from '@/components/auth/password-input'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { loginMutationFn } from '@/lib/api'

const signInSchema = z.object({
  email: z.string().trim().email('Enter a valid work email'),
  password: z.string().min(1, 'Enter your password'),
})

type SignInValues = z.infer<typeof signInSchema>

export default function SignInPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: loginMutationFn,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, { user })
      navigate('/dashboard')
    },
    onError: (error: { message: string }) => toast.error(error.message),
  })

  return (
    <AuthLayout
      title={
        <>
          Welcome back to
          <br />
          your canvas.
        </>
      }
      description="Pick up where your team left off and keep the ideas moving."
      headerAction={
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">New to Kano?</span>
          <Button variant="outline" size="sm" asChild>
            <Link to="/sign-up">Create account</Link>
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Logo className="lg:hidden" />

        <div className="flex flex-col gap-1.5">
          <h1 className="text-4xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground">
            Sign in to continue collaborating with your team.
          </p>
        </div>

        <GoogleButton label="Continue with Google" />

        <div className="flex items-center gap-4">
          <Separator className="flex-1" />
          <span className="text-sm text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={form.handleSubmit((values) => mutate(values))}>
          <FieldGroup>
            <Field data-invalid={!!form.formState.errors.email || undefined}>
              <FieldLabel htmlFor="email">Work email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                aria-invalid={!!form.formState.errors.email || undefined}
                {...form.register('email')}
              />
              {form.formState.errors.email ? (
                <FieldDescription>
                  {form.formState.errors.email.message}
                </FieldDescription>
              ) : null}
            </Field>

            <Field data-invalid={!!form.formState.errors.password || undefined}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <PasswordInput
                id="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-invalid={!!form.formState.errors.password || undefined}
                {...form.register('password')}
              />
              {form.formState.errors.password ? (
                <FieldDescription>
                  {form.formState.errors.password.message}
                </FieldDescription>
              ) : null}
            </Field>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Spinner data-icon="inline-start" /> : null}
              Sign in
            </Button>
          </FieldGroup>
        </form>
      </div>
    </AuthLayout>
  )
}
