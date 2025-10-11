// remappings-helper.d.ts

export function remapImportPaths(): {
  eachLine: () => {
    transform: (line: string) => string;
    settings: { remappings: Record<string, string> };
  };
};
