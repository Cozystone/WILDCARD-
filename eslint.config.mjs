import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // The pictures here are drawn at their own pixel sizes on purpose — the
      // seal, the renders, the photograph's grain (components/Hero.tsx) —
      // and must not be re-encoded by the image optimizer.
      '@next/next/no-img-element': 'off',
    },
  },
  {
    // The animation components from before these rules: they keep the
    // latest props in refs for their frame loops and restart their typing
    // from an effect, on purpose. The React Compiler's rules report them as
    // warnings here until they are reworked; everything else is held to
    // them in full.
    files: ['components/CodeRain.tsx', 'components/Terminal.tsx', 'components/PixelScreen.tsx', 'components/apply/Apply.tsx'],
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'public/**', 'tools/**', 'supabase/**']),
]);
