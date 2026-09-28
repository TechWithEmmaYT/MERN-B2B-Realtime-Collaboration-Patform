import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'
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
import { registerMutationFn } from '@/lib/api'

const signUpSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name'),
  email: z.string().trim().email('Enter a valid work email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type SignUpValues = z.infer<typeof signUpSchema>

export default function SignUpPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: registerMutationFn,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, { user })
      navigate(redirect?.startsWith('/') ? redirect : '/onboarding/workspace')
    },
    onError: (error: { message: string }) => toast.error(error.message),
  })

  return (
    <AuthLayout
      title={
        <>
          Ideas move
          <br />
          faster together.
        </>
      }
      description="Collaborate with your team and AI on one shared canvas."
      headerAction={
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Already have an account?
          </span>
          <Button variant="outline" size="sm" asChild>
            <Link to="/sign-in">Sign in</Link>
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Logo className="lg:hidden" />

        <div className="flex flex-col gap-1.5">
          <h1 className="text-4xl font-bold tracking-tight">Create your account</h1>
          <p className="text-muted-foreground">
            Start collaborating with your team today.
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
            <Field data-invalid={!!form.formState.errors.name || undefined}>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input
                id="name"
                placeholder="John Doe"
                autoComplete="name"
                aria-invalid={!!form.formState.errors.name || undefined}
                {...form.register('name')}
              />
              {form.formState.errors.name ? (
                <FieldDescription>
                  {form.formState.errors.name.message}
                </FieldDescription>
              ) : null}
            </Field>

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
                placeholder="Create a strong password"
                autoComplete="new-password"
                aria-invalid={!!form.formState.errors.password || undefined}
                {...form.register('password')}
              />
              {form.formState.errors.password ? (
                <FieldDescription>
                  {form.formState.errors.password.message}
                </FieldDescription>
              ) : null}
            </Field>

            <Button type="submit" className="w-full" size="lg" disabled={isPending}>
              {isPending ? <Spinner data-icon="inline-start" /> : null}
              Create account
            </Button>
          </FieldGroup>
        </form>

        <p className="text-center text-[13px] text-muted-foreground">
          By creating an account, you agree to our{' '}
          <a href="/terms" className="text-foreground underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-foreground underline">
            Privacy Policy
          </a>
          .
        </p>

       
      </div>
    </AuthLayout>
  )
}
