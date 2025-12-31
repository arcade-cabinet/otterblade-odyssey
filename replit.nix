{ pkgs }: {
  deps = [
    pkgs.nodejs_22
    pkgs.nodePackages.pnpm
    pkgs.postgresql_16
  ];
}