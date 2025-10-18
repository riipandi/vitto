/**
 * Metadata collector for capturing metadata from templates
 */
interface MetadataCollector {
  metadata: Record<string, any>
  setMetadata: (key: string, value: any) => void
  getMetadata: (key?: string) => any
}

/**
 * Create a metadata collector instance
 */
export function createMetadataCollector(): MetadataCollector {
  const metadata: Record<string, any> = {}

  return {
    metadata,
    setMetadata(key: string, value: any) {
      this.metadata[key] = value
    },
    getMetadata(key?: string) {
      // If key is provided, return specific value (or undefined if not found)
      if (key !== undefined && key !== null && key !== '') {
        return this.metadata[key]
      }
      // If no key, return all metadata
      return { ...this.metadata }
    },
  }
}
