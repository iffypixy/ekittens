{
  description = "ekittens — world-class web adaptation of Exploding Kittens";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          # Pinned toolchain — local == CI by construction.
          packages = with pkgs; [
            nodejs_24
            corepack_24 # provides pnpm (version from package.json packageManager)
            biome
            postgresql_16 # psql client
            redis # redis-cli
            docker-compose
          ];

          shellHook = ''
            corepack enable 2>/dev/null || true
            echo "ekittens dev shell — node $(node -v), pnpm $(pnpm -v 2>/dev/null || echo '(run: corepack enable)')"
          '';
        };
      });
}
