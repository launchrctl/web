import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    ignores: [
      'node_modules/',
      'dist/',
      'jest.config.ts',
      'openapi.d.ts',
      'src/components/rjsf/widgets/SwitchPackage.tsx',
      'src/components/rjsf/CustomObjectFieldTemplate.tsx',
    ],
  }
)
