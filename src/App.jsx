
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState("login");
  const [recoveryMode, setRecoveryMode] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showSettings, setShowSettings] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  function notify(text, type = "error") {
    setMessage(text);
    setMessageType(type);
  }

  function clearMessage() {
    setMessage("");
    setMessageType("error");
  }

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!active) return;

        if (error) {
          notify("Unable to load your session. Please refresh.");
        }

        setUser(data?.session?.user ?? null);
      } catch {
        if (active) {
          notify("Unable to load your session. Please refresh.");
          setUser(null);
        }
      } finally {
        if (active) setReady(true);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      setUser(session?.user ?? null);

      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
        setShowSettings(false);
        setShowChangePassword(false);
        setMessage("");
      }

      if (event === "SIGNED_OUT") {
        setRecoveryMode(false);
        setShowSettings(false);
        setShowChangePassword(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleAuth(event) {
    event.preventDefault();
    clearMessage();
    setLoading(true);

    try {
      const cleanEmail = email.trim();

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
          },
        });

        if (error) throw error;

        setPassword("");

        if (data.session && data.user) {
          setUser(data.user);
          notify("Your sign-up request was processed successfully.", "success");
        } else {
          notify(
            "If this email can be registered, check your inbox for further instructions.",
            "success"
          );
        }
      } else {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

        if (error) throw error;

        setUser(data.user);
        setPassword("");
        notify("Welcome back! You signed in successfully.", "success");
      }
    } catch (error) {
      notify(error.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    clearMessage();

    if (!email.trim()) {
      notify("Please enter your email address first.");
      return;
    }

    setLoading(true);

    try {
      const { error } =
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });

      if (error) throw error;

      notify(
        "If an account exists for this email, a reset link has been sent.",
        "success"
      );
    } catch (error) {
      notify(error.message || "Unable to send the reset email.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordRecovery(event) {
    event.preventDefault();
    clearMessage();

    if (newPassword.length < 8) {
      notify("Your password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      notify("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setUser(data.user ?? user);
      setRecoveryMode(false);
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      notify("Your password has been reset successfully.", "success");
    } catch (error) {
      notify(error.message || "Unable to reset your password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault();
    clearMessage();

    if (!user?.email) {
      notify("Please sign in again before changing your password.");
      return;
    }

    if (newPassword.length < 8) {
      notify("Your new password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      notify("The new passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      notify("Choose a password different from your current password.");
      return;
    }

    setLoading(true);

    try {
      const { error: verifyError } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

      if (verifyError) {
        notify("Your current password is incorrect.");
        return;
      }

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setUser(data.user ?? user);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowChangePassword(false);

      notify("Your password has been changed successfully.", "success");
    } catch (error) {
      notify(error.message || "Unable to change your password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    clearMessage();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setUser(null);
      setRecoveryMode(false);
      setShowSettings(false);
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPassword("");

      notify("You have signed out successfully.", "success");
    } catch (error) {
      notify(error.message || "Sign out failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <p>Loading your secure account...</p>
        </section>
      </main>
    );
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  return (
    <main className="auth-page">
      <section className="auth-showcase">
        <div className="brand">
          <div className="brand-icon">A</div>
          <span>AuthSecure</span>
        </div>

        <div className="showcase-content">
          <p className="eyebrow">AUTHENTICATION DONE SAFELY</p>

          <h1>
            Your security.
            <br />
            <span>Your control.</span>
          </h1>

          <p className="showcase-description">
            A simple and secure way to manage your account and
            protect your digital identity.
          </p>

          <div className="security-note">
            <div className="security-icon">✓</div>
            <div>
              <strong>Security comes first</strong>
              <p>Powered by Supabase Authentication.</p>
            </div>
          </div>
        </div>

        <div className="showcase-footer">
          Secure account access · Private by design
        </div>
      </section>

      <section className="auth-panel">
        <div className="mobile-brand">
          <div className="brand-icon">A</div>
          <span>AuthSecure</span>
        </div>

        <div className="auth-card">
          {message && (
            <div className={`message ${messageType}`} role="status">
              {message}
            </div>
          )}

          {recoveryMode ? (
            <>
              <div className="welcome-icon">✦</div>
              <p className="form-label">ACCOUNT RECOVERY</p>
              <h2>Set a new password</h2>
              <p className="form-description">
                Choose a new password to secure your account.
              </p>

              <form onSubmit={handlePasswordRecovery}>
                <div className="form-group">
                  <label htmlFor="recovery-password">New Password</label>
                  <input
                    id="recovery-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="recovery-confirm">Confirm Password</label>
                  <input
                    id="recovery-confirm"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <label className="remember-option">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                  />
                  Show passwords
                </label>

                <button className="submit-button" disabled={loading}>
                  {loading ? "Updating..." : "Reset Password →"}
                </button>
              </form>
            </>
          ) : user ? (
            <>
              <div className="welcome-icon">✓</div>
              <p className="form-label">YOUR ACCOUNT</p>
              <h2>Welcome, {displayName}</h2>
              <p className="form-description">
                You are signed in. Manage your account and security settings.
              </p>

              <section className="account-details">
                <div className="account-detail">
                  <span>Full Name</span>
                  <strong>{displayName}</strong>
                </div>

                <div className="account-detail">
                  <span>Email Address</span>
                  <strong>{user.email}</strong>
                </div>

                <div className="account-detail">
                  <span>Email Verification</span>
                  <strong
                    className={
                      user.email_confirmed_at ? "verified" : "pending"
                    }
                  >
                    {user.email_confirmed_at ? "Verified" : "Not verified"}
                  </strong>
                </div>
              </section>

              <button
                type="button"
                className="submit-button"
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowChangePassword(false);
                  clearMessage();
                }}
              >
                {showSettings ? "Close Settings" : "Account Settings"}
              </button>

              {showSettings && (
                <section className="settings-section">
                  <h3>Security Settings</h3>
                  <p className="form-description">
                    Keep your account secure by updating your password.
                  </p>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setShowChangePassword(!showChangePassword);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      clearMessage();
                    }}
                  >
                    {showChangePassword ? "Cancel" : "Change Password"}
                  </button>

                  {showChangePassword && (
                    <form
                      className="change-password-form"
                      onSubmit={handleChangePassword}
                    >
                      <div className="form-group">
                        <label htmlFor="current-password">
                          Current Password
                        </label>
                        <input
                          id="current-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          value={currentPassword}
                          onChange={(e) =>
                            setCurrentPassword(e.target.value)
                          }
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="new-password">New Password</label>
                        <input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          minLength={8}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="confirm-password">
                          Confirm New Password
                        </label>
                        <input
                          id="confirm-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          minLength={8}
                          value={confirmPassword}
                          onChange={(e) =>
                            setConfirmPassword(e.target.value)
                          }
                          required
                        />
                      </div>

                      <label className="remember-option">
                        <input
                          type="checkbox"
                          checked={showPassword}
                          onChange={(e) => setShowPassword(e.target.checked)}
                        />
                        Show passwords
                      </label>

                      <button
                        className="submit-button"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? "Updating..." : "Update Password →"}
                      </button>
                    </form>
                  )}
                </section>
              )}

              <button
                type="button"
                className="signout-button"
                onClick={handleSignOut}
                disabled={loading}
              >
                {loading ? "Please wait..." : "Sign Out"}
              </button>

              <div className="privacy-note">
                <span>◆</span> Your account security matters.
              </div>
            </>
          ) : (
            <>
              <div className="welcome-icon">✦</div>

              <p className="form-label">
                {mode === "signup" ? "GET STARTED" : "WELCOME BACK"}
              </p>

              <h2>
                {mode === "signup"
                  ? "Create your account"
                  : "Sign in to your account"}
              </h2>

              <p className="form-description">
                {mode === "signup"
                  ? "Create your secure account in a few simple steps."
                  : "Enter your details to access your secure dashboard."}
              </p>

              <form onSubmit={handleAuth}>
                {mode === "signup" && (
                  <div className="form-group">
                    <label htmlFor="full-name">Full Name</label>
                    <input
                      id="full-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>

                  <div className="password-field">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={
                        mode === "signup"
                          ? "new-password"
                          : "current-password"
                      }
                      minLength={mode === "signup" ? 8 : undefined}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  {mode === "signup" && (
                    <p className="field-hint">
                      Use at least 8 characters.
                    </p>
                  )}
                </div>

                {mode === "login" && (
                  <div className="form-options">
                    <span />
                    <button
                      type="button"
                      className="text-button"
                      onClick={handleForgotPassword}
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  className="submit-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "Please wait..."
                    : mode === "signup"
                      ? "Create Account →"
                      : "Sign In →"}
                </button>
              </form>

              <div className="switch-mode">
                {mode === "signup"
                  ? "Already have an account?"
                  : "Don't have an account?"}{" "}

                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setMode(mode === "signup" ? "login" : "signup");
                    setPassword("");
                    clearMessage();
                  }}
                >
                  {mode === "signup" ? "Sign in" : "Create an account"}
                </button>
              </div>

              <div className="privacy-note">
                <span>◆</span> Your information is protected.
              </div>
            </>
          )}

          <div className="panel-footer">
            Authentication Done Safely · Secure access for everyone
          </div>
        </div>
      </section>
    </main>
  );
}
