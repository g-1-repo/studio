export default {
  deployments: [{
    target: 'cloudflare-workers',
    command: 'bun run deploy',
    preCommand: 'bun run typecheck'
  }],
  github: {
    autoRelease: true,
    autoMerge: true,
    labels: ['enhancement', 'automated']
  },
  commands: {
    preRelease: ['bun run typecheck', 'bun run lint', 'bun run test:ci'],
    postRelease: ['echo "✅ Release complete!"']
  }
}