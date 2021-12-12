declare namespace manifest {
  export type ManifestValue = Record<string, string>;
  export type AcceptableModuleNames = "lib" | "layouts" | "pages";
  export type Manifest = {
    [K in AcceptableModuleNames]?: ManifestValue;
  };
}
