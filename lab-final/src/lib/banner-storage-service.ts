// Banner Storage Service
// Handles saving banner images to GitHub repository

import { generateBannerSVG, generateBannerFileName, getBannerGitHubPath, BannerConfig } from './banner-generator'

export interface BannerStorageResult {
  success: boolean
  fileName?: string
  githubPath?: string
  error?: string
}

export class BannerStorageService {
  private static instance: BannerStorageService
  private githubToken: string
  private repoOwner: string
  private repoName: string
  private branch: string

  constructor() {
    this.githubToken = process.env.GITHUB_TOKEN || ''
    this.repoOwner = process.env.GITHUB_REPO_OWNER || 'shaniparacha2021'
    this.repoName = process.env.GITHUB_REPO_NAME || 'LabFinal'
    this.branch = process.env.GITHUB_BRANCH || 'main'
  }

  static getInstance(): BannerStorageService {
    if (!BannerStorageService.instance) {
      BannerStorageService.instance = new BannerStorageService()
    }
    return BannerStorageService.instance
  }

  async saveBannerToGitHub(
    announcementId: string,
    config: BannerConfig
  ): Promise<BannerStorageResult> {
    try {
      if (!this.githubToken) {
        return {
          success: false,
          error: 'GitHub token not configured'
        }
      }

      // Generate SVG content
      const svgContent = generateBannerSVG(config)
      
      // Generate file name and path
      const fileName = generateBannerFileName(announcementId, config.type)
      const githubPath = getBannerGitHubPath(fileName)
      
      // GitHub API URL
      const apiUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${githubPath}`
      
      // Check if file already exists
      const existingFile = await this.getFileFromGitHub(githubPath)
      
      // Prepare request body
      const requestBody: any = {
        message: `Add announcement banner: ${config.title}`,
        content: Buffer.from(svgContent).toString('base64'),
        branch: this.branch
      }
      
      // If file exists, include the SHA for update
      if (existingFile) {
        requestBody.sha = existingFile.sha
        requestBody.message = `Update announcement banner: ${config.title}`
      }
      
      // Make API request
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          error: `GitHub API error: ${errorData.message || response.statusText}`
        }
      }
      
      const result = await response.json()
      
      return {
        success: true,
        fileName,
        githubPath: result.content.html_url
      }
      
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to save banner to GitHub: ${error.message}`
      }
    }
  }

  async getFileFromGitHub(path: string): Promise<any> {
    try {
      const apiUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${path}?ref=${this.branch}`
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })
      
      if (response.ok) {
        return await response.json()
      }
      
      return null
    } catch (error) {
      return null
    }
  }

  async deleteBannerFromGitHub(githubPath: string): Promise<BannerStorageResult> {
    try {
      if (!this.githubToken) {
        return {
          success: false,
          error: 'GitHub token not configured'
        }
      }

      // Get file info first
      const fileInfo = await this.getFileFromGitHub(githubPath)
      if (!fileInfo) {
        return {
          success: false,
          error: 'File not found in GitHub'
        }
      }

      // GitHub API URL
      const apiUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${githubPath}`
      
      // Make delete request
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Delete announcement banner`,
          sha: fileInfo.sha,
          branch: this.branch
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          error: `GitHub API error: ${errorData.message || response.statusText}`
        }
      }
      
      return {
        success: true
      }
      
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to delete banner from GitHub: ${error.message}`
      }
    }
  }

  getBannerUrl(githubPath: string): string {
    // Convert GitHub content path to raw URL
    const rawUrl = githubPath.replace(
      'https://github.com/',
      'https://raw.githubusercontent.com/'
    ).replace('/blob/', '/')
    
    return rawUrl
  }

  async createBannerDirectory(): Promise<boolean> {
    try {
      if (!this.githubToken) {
        return false
      }

      const directoryPath = 'assets/images/announcements/banners'
      const apiUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${directoryPath}`
      
      // Try to create a placeholder file to ensure directory exists
      const placeholderContent = Buffer.from('# Announcement Banners\n\nThis directory contains announcement banner images.').toString('base64')
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Create announcement banners directory',
          content: placeholderContent,
          branch: this.branch
        })
      })
      
      // Directory might already exist, which is fine
      return response.ok || response.status === 422 // 422 means file already exists
      
    } catch (error) {
      return false
    }
  }
}
