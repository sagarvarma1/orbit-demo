import { useEffect, useState } from "react";

// Change this line and push a commit to see a new preview deployment.
const VERSION = "v1";

const env = import.meta.env;

function usePath() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const navigate = (to) => {
    window.history.pushState({}, "", to);
    setPath(to);
  };
  return [path, navigate];
}

export default function App() {
  const [path, navigate] = usePath();
  const [fn, setFn] = useState(null);

  async function callFunction() {
    setFn({ loading: true });
    try {
      const res = await fetch("/api/hello?name=Orbit");
      setFn(await res.json());
    } catch (err) {
      setFn({ error: String(err) });
    }
  }

  return (
    <main>
      <span className="badge">{env.ORBIT_ENV ?? "local"}</span>
      <h1>
        Hello from Orbit <span className="version">{VERSION}</span>
      </h1>
      <p className="message">{env.VITE_MESSAGE ?? "Set VITE_MESSAGE in Orbit to change this line."}</p>

      <nav>
        <a href="/" onClick={(e) => (e.preventDefault(), navigate("/"))} className={path === "/" ? "active" : ""}>
          Home
        </a>
        <a href="/about" onClick={(e) => (e.preventDefault(), navigate("/about"))} className={path === "/about" ? "active" : ""}>
          About (client route)
        </a>
      </nav>

      {path === "/about" ? (
        <p className="muted">This page is a client-side route. Reload it: Orbit's SPA fallback serves index.html.</p>
      ) : (
        <section>
          <button onClick={callFunction}>Call /api/hello</button>
          {fn && <pre>{fn.loading ? "…" : JSON.stringify(fn, null, 2)}</pre>}
        </section>
      )}

      <footer>
        <span>commit {env.ORBIT_GIT_COMMIT_SHA?.slice(0, 7) ?? "local"}</span>
        <span>branch {env.ORBIT_GIT_COMMIT_REF ?? "local"}</span>
        <span>{env.ORBIT_DEPLOYMENT_ID ?? "dev server"}</span>
      </footer>
    </main>
  );
}
