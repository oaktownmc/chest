{
  description = "file host thingy";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
    ...
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = import nixpkgs {inherit system;};
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = [
            pkgs.nodejs
          ];

          shellHook = ''
            # Automatically run npm install when entering the shell
            if [ ! -d "node_modules" ]; then
              echo "Installing npm dependencies..."
              npm install
            fi
          '';
        };
      }
    );
}
