import {
  CircleAlert,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  UserRound,
} from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { LoginError, login } from "@/lib/api";
import { t } from "@/lib/i18n";

const OTP_LENGTH = 6;
const OTP_SLOTS = Array.from({ length: OTP_LENGTH }, (_, index) => index);

export function LoginDialog({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const otpId = useId();
  const otpDescriptionId = `${otpId}-description`;

  function resetDialog() {
    setPassword("");
    setTotp("");
    setNeedsTwoFactor(false);
    setPending(false);
    setShowPassword(false);
    setErrorMessage("");
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetDialog();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage("");
    setPending(true);
    try {
      await login(username, password, totp);
      handleOpenChange(false);
      onLoggedIn();
    } catch (error) {
      if (error instanceof LoginError && error.needsTwoFactor) {
        setNeedsTwoFactor(true);
        setTotp("");
        return;
      }
      if (error instanceof LoginError) {
        setErrorMessage(
          error.message === "Invalid credentials"
            ? t("invalidCredentials")
            : error.message === "Invalid 2FA code"
              ? t("invalidTotp")
              : error.message || t("loginFailed"),
        );
      } else {
        setErrorMessage(t("loginFailed"));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="default"
            className="rounded-lg bg-card px-4 shadow-xs"
          />
        }
      >
        {t("login")}
      </DialogTrigger>
      <DialogContent className="gap-0 overflow-hidden rounded-lg p-0 sm:max-w-sm">
        <form onSubmit={(event) => void handleSubmit(event)} className="grid">
          <DialogHeader className="gap-0 px-6 pt-6 pb-5">
            <div className="flex items-start gap-3 pr-7">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                <LockKeyhole className="size-4.5" />
              </div>
              <div className="min-w-0 pt-0.5">
                <DialogTitle className="text-lg leading-6">
                  {needsTwoFactor ? t("totpTitle") : t("login")}
                </DialogTitle>
                <DialogDescription className="mt-1.5 leading-5">
                  {needsTwoFactor
                    ? t("totpDescription")
                    : t("loginDescription")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="grid gap-4 px-6 pb-5">
            {needsTwoFactor ? (
              <div className="grid gap-2">
                <Label htmlFor={otpId}>{t("totp")}</Label>
                <InputOTP
                  id={otpId}
                  length={OTP_LENGTH}
                  value={totp}
                  onValueChange={(value) => {
                    setTotp(value);
                    setErrorMessage("");
                  }}
                  required
                  disabled={pending}
                  aria-describedby={otpDescriptionId}
                  className="justify-between gap-1.5"
                >
                  {OTP_SLOTS.map((index) => (
                    <InputOTPSlot
                      key={index}
                      autoFocus={index === 0}
                      placeholder="·"
                      aria-invalid={Boolean(errorMessage)}
                      aria-label={
                        index === 0
                          ? undefined
                          : `${t("totp")} ${index + 1} / ${OTP_LENGTH}`
                      }
                    />
                  ))}
                </InputOTP>
                <p
                  id={otpDescriptionId}
                  className="text-xs text-muted-foreground"
                >
                  {t("totpDescription")}
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="slate-username">{t("username")}</Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="slate-username"
                      autoComplete="username"
                      placeholder={t("usernamePlaceholder")}
                      value={username}
                      onChange={(event) => {
                        setUsername(event.target.value);
                        setErrorMessage("");
                      }}
                      aria-invalid={Boolean(errorMessage)}
                      className="h-10 rounded-lg pr-3 pl-9"
                      autoFocus
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slate-password">{t("password")}</Label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="slate-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder={t("passwordPlaceholder")}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setErrorMessage("");
                      }}
                      aria-invalid={Boolean(errorMessage)}
                      className="h-10 rounded-lg pr-10 pl-9"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-lg text-muted-foreground hover:text-foreground"
                      aria-label={
                        showPassword ? t("hidePassword") : t("showPassword")
                      }
                      title={
                        showPassword ? t("hidePassword") : t("showPassword")
                      }
                      onClick={() => setShowPassword((visible) => !visible)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                </div>
              </>
            )}
            {errorMessage ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-destructive/8 px-3 py-2.5 text-xs leading-5 text-destructive"
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            ) : null}
          </div>
          <DialogFooter className="m-0 grid grid-cols-1 rounded-none px-6 py-4 sm:grid-cols-1">
            {needsTwoFactor ? (
              <div className="grid grid-cols-[auto_1fr] gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg"
                  disabled={pending}
                  onClick={() => {
                    setNeedsTwoFactor(false);
                    setTotp("");
                    setErrorMessage("");
                  }}
                >
                  {t("totpBack")}
                </Button>
                <Button
                  type="submit"
                  className="rounded-lg"
                  disabled={pending || totp.length < OTP_LENGTH}
                >
                  {pending ? (
                    <LoaderCircle className="animate-spin motion-reduce:animate-none" />
                  ) : null}
                  {pending ? t("verifying") : t("submit")}
                </Button>
              </div>
            ) : (
              <Button
                type="submit"
                className="w-full rounded-lg"
                disabled={pending}
              >
                {pending ? (
                  <LoaderCircle className="animate-spin motion-reduce:animate-none" />
                ) : null}
                {t("submit")}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
