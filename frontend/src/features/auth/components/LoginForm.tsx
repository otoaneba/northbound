import './AuthComponents.scss'

export function LoginForm() {
  return (
    <form>
      <div className="auth-container">
        <div className="auth-input-container">
          <label htmlFor='email'>User name</label>
          <input id="email" name="email" required minLength={2} maxLength={20} autoComplete="email"/>
          <label htmlFor='password'>Password</label>
          <input type="password" id="password" name="password" required minLength={8} autoComplete="current-password" />
        </div>
        <button type="submit">Log in</button>
      </div>
    </form>
  )
}