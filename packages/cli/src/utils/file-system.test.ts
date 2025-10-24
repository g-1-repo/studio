import fs from 'fs-extra'
import path from 'path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock fs-extra
vi.mock('fs-extra', () => ({
    default: {
        ensureDir: vi.fn(),
        writeFile: vi.fn(),
        remove: vi.fn(),
        access: vi.fn(),
        readdir: vi.fn(),
        stat: vi.fn(),
        constants: { W_OK: 2 }
    }
}))

// Mock path
vi.mock('path', () => ({
    default: {
        join: vi.fn((...args: string[]) => args.join('/'))
    },
    join: vi.fn((...args: string[]) => args.join('/'))
}))

import {
    ensureWritableDirectory,
    formatFileSize,
    getFileSize,
    isDirectoryEmpty
} from './file-system'

const mockFs = vi.mocked(fs)
const mockPath = vi.mocked(path)

describe('File System Utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('formatFileSize', () => {
        it('should format bytes correctly', () => {
            expect(formatFileSize(0)).toBe('0.0 B')
            expect(formatFileSize(512)).toBe('512.0 B')
            expect(formatFileSize(1024)).toBe('1.0 KB')
            expect(formatFileSize(1536)).toBe('1.5 KB')
            expect(formatFileSize(1048576)).toBe('1.0 MB')
        })
    })

    describe('ensureWritableDirectory', () => {
        it('should create directory and test file successfully', async () => {
            mockFs.ensureDir.mockResolvedValue(undefined)
            mockFs.writeFile.mockResolvedValue(undefined)
            mockFs.remove.mockResolvedValue(undefined)
            mockPath.join.mockReturnValue('/test/dir/.write-test')

            await expect(ensureWritableDirectory('/test/dir')).resolves.toBeUndefined()
        })

        it('should throw error if directory is not writable', async () => {
            mockFs.ensureDir.mockResolvedValue(undefined)
            mockFs.writeFile.mockRejectedValue(new Error('Permission denied'))
            mockPath.join.mockReturnValue('/test/dir/.write-test')

            await expect(ensureWritableDirectory('/test/dir')).rejects.toThrow('Directory is not writable: /test/dir')
        })
    })

    describe('isDirectoryEmpty', () => {
        it('should return true for empty directory', async () => {
            mockFs.readdir.mockResolvedValue([] as any)

            const result = await isDirectoryEmpty('/test/empty')

            expect(result).toBe(true)
        })

        it('should return false for non-empty directory', async () => {
            mockFs.readdir.mockResolvedValue(['file.txt'] as any)

            const result = await isDirectoryEmpty('/test/nonempty')

            expect(result).toBe(false)
        })

        it('should return true if directory does not exist', async () => {
            mockFs.readdir.mockRejectedValue(new Error('ENOENT'))

            const result = await isDirectoryEmpty('/test/nonexistent')

            expect(result).toBe(true)
        })
    })

    describe('getFileSize', () => {
        it('should return file size', async () => {
            mockFs.stat.mockResolvedValue({ size: 1024 } as any)

            const result = await getFileSize('/test/file.txt')

            expect(result).toBe(1024)
        })

        it('should return 0 if file does not exist', async () => {
            mockFs.stat.mockRejectedValue(new Error('File not found'))

            const result = await getFileSize('/nonexistent/file.txt')

            expect(result).toBe(0)
        })
    })
})