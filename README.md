# Hands-on Lab: From Dockerfile to Docker Hub

This repository contains the complete implementation for building, verifying, automating, and publishing an Express.js web service container image to Docker Hub with unique execution tags using GitHub Actions.

---

## 🛠️ Architecture & Project Structure

- **Application Stack**: Node.js 24 LTS + Express 5
- **Endpoints**:
  - `GET /` -> Returns JSON status `{ "message": "Hello from Docker!", "runtime": "v..." }`
  - `GET /health` -> Returns `200 ok` for readiness/liveness checks
- **Dockerfile Features**:
  - Multi-stage build (`dependencies` and `runtime` stages based on `node:24-bookworm-slim`)
  - Build cache mount for npm (`--mount=type=cache,target=/root/.npm`)
  - Deterministic dependency resolution (`npm ci --omit=dev`)
  - Security hardening: executes as unprivileged user `USER node`
  - Container health check: probes `http://127.0.0.1:3000/health`
  - Exec-form CMD: `CMD ["node", "server.js"]`

---

## 🚀 CI/CD Pipeline (GitHub Actions)

The workflow defined in [`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml) automates:
1. Triggering on push to `main` and `workflow_dispatch`.
2. Secure authentication using Docker Hub access token stored in GitHub Secrets.
3. Automated tagging via `docker/metadata-action`:
   - `run-<run_id>-<run_attempt>`: Guaranteed unique tag for every execution attempt
   - `sha-<commit_sha>`: Source code commit traceability
   - `latest`: Convenience tag pointing to the latest main build
4. Multi-stage build and push with GitHub Actions cache (`type=gha`), SBOM generation, and SLSA provenance (`mode=max`).

---

## 📝 Answers to Reflection Questions

### Q68: Why does copying package manifests before `server.js` improve rebuild time?
> **Answer:** Docker builds images layer by layer and caches each layer. Copying `package*.json` and running `npm ci` before copying application source files ensures that Docker reuses the cached npm dependency layer whenever only `server.js` changes, avoiding slow dependency downloads on every code update.

### Q69: What security boundary is created by `USER node`, and what does it not protect against?
> **Answer:** `USER node` enforces least-privilege execution by running application processes as an unprivileged non-root user (UID 1000). This prevents container breakout vulnerabilities where an attacker executing arbitrary code inside the container could gain root privileges on the underlying host. It does not protect against application-level logic flaws (such as auth bypass or DoS) or kernel-level vulnerabilities shared across containers.

### Q70: Why is `sha-<short-sha>` traceable but not unique across workflow re-runs?
> **Answer:** A commit SHA identifies the immutable snapshot of Git source code. Re-running a workflow on the same commit will produce the exact same commit SHA. To uniquely differentiate individual execution attempts of the same commit, the composite tag `run-<run_id>-<run_attempt>` is used.

### Q71: When should a deployment refer to an image digest instead of `latest`?
> **Answer:** Production environments and Kubernetes deployments should always use immutable image digests (`image@sha256:...`). The `latest` tag is mutable and can be overwritten by subsequent builds, leading to untracked configuration drift, breaking changes, and irreproducible deployments.

### Q72: Which changes would you make before using this workflow in a production organization?
> **Answer:**
> 1. **Pin Actions to Commit SHAs:** Pin all third-party GitHub Actions to 40-character commit SHAs with Dependabot automated updates.
> 2. **OIDC Authentication:** Replace long-lived Personal Access Tokens with OpenID Connect (OIDC) federated credentials.
> 3. **Vulnerability Scanning:** Add automated CVE scanning (e.g., Docker Scout, Trivy, or Snyk) to gate deployments.
> 4. **Multi-Architecture Builds:** Enable QEMU/Buildx to build and publish multi-platform images (`linux/amd64`, `linux/arm64`).
> 5. **PR Validation Separation:** Separate PR builds (build & test without registry push) from release publish jobs.
