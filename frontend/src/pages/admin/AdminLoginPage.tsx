import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, LogIn, Terminal } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

import { ThemeToggle } from "@/components/common/ThemeToggle";
import { FormField, TextInput } from "@/components/form/FormField";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { routes } from "@/constants/routes";
import { useLogin } from "@/features/auth";
import { useAuthStore } from "@/stores/authStore";
import { getErrorMessage } from "@/utils/errors";

const loginSchema = z.object({
  email: z.string().email("Enter a valid admin email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LocationState {
  from?: {
    pathname?: string;
  };
}

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAuthReady = useAuthStore((state) => state.isAuthReady);
  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? routes.admin;

  const {
    formState: { errors },
    handleSubmit,
    register,
    setFocus,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    setFocus("email");
  }, [setFocus]);

  if (isAuthReady && isAuthenticated) {
    return <Navigate replace to={redirectTo} />;
  }

  async function onSubmit(values: LoginFormValues) {
    try {
      await login.mutateAsync(values);
      toast.success("Admin session restored.");
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "Admin login failed."));
    }
  }

  return (
    <section className="grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="hidden rounded-md border border-border bg-surface p-6 lg:block">
        <div className="flex h-full flex-col justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Terminal className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-6 text-xs font-medium uppercase text-muted-foreground">
              Protected Workspace
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">
              Sandesh portfolio control plane
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
              Sign in to manage projects, notes, skills, resume data, media, and workspace
              settings from the admin dashboard.
            </p>
          </div>

          <div className="rounded-md border border-border bg-background p-4 font-mono text-xs text-muted-foreground">
            <p>auth.mode = jwt_refresh</p>
            <p>role.required = admin</p>
            <p>session.persistence = enabled</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <LockKeyhole className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Use the single admin account to enter the dashboard.</CardDescription>
          </div>
          <ThemeToggle />
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
            <FormField label="Email" error={errors.email?.message}>
              <TextInput
                type="email"
                autoComplete="email"
                {...register("email")}
                hasError={Boolean(errors.email)}
              />
            </FormField>

            <FormField label="Password" error={errors.password?.message}>
              <TextInput
                type="password"
                autoComplete="current-password"
                {...register("password")}
                hasError={Boolean(errors.password)}
              />
            </FormField>

            <Button
              type="submit"
              className="w-full"
              isLoading={login.isPending}
              rightIcon={<LogIn className="h-4 w-4" />}
            >
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
