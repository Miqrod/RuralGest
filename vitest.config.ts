import { resolve } from 'path'

export default {
  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },
  test: {
    include: ['**/*.{test,spec,eval}.?(c|m)[jt]s?(x)'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
}