{ pkgs }: {
  deps = [
    pkgs.nodejs_25
    pkgs.nodePackages.pnpm
    pkgs.postgresql_16
  ];
}