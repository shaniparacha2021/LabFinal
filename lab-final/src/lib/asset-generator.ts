import fs from 'fs'
import path from 'path'

export interface AdminAssetData {
  adminId: string
  adminName: string
  adminEmail: string
  adminPhone?: string
}

export interface GeneratedAsset {
  asset_type: 'header_image' | 'footer_image' | 'watermark_image'
  asset_name: string
  file_path: string
  github_url: string
  file_size: number
  mime_type: string
}

/**
 * Generate personalized assets for a new admin
 */
export async function generateAdminAssets(adminData: AdminAssetData): Promise<GeneratedAsset[]> {
  const { adminId, adminName, adminEmail, adminPhone } = adminData
  
  // Create personalized assets directory
  const assetsDir = path.join(process.cwd(), 'assets', 'images', 'generated', adminId)
  
  // Ensure directory exists
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true })
  }
  
  const assets: GeneratedAsset[] = []
  
  // Generate Header Image
  const headerAsset = await generateHeaderAsset(adminData, assetsDir)
  assets.push(headerAsset)
  
  // Generate Footer Image
  const footerAsset = await generateFooterAsset(adminData, assetsDir)
  assets.push(footerAsset)
  
  // Generate Watermark Image
  const watermarkAsset = await generateWatermarkAsset(adminData, assetsDir)
  assets.push(watermarkAsset)
  
  return assets
}

/**
 * Generate personalized header image
 */
async function generateHeaderAsset(adminData: AdminAssetData, assetsDir: string): Promise<GeneratedAsset> {
  const { adminId, adminName } = adminData
  const fileName = `header-${adminId}.svg`
  const filePath = path.join(assetsDir, fileName)
  const relativePath = `assets/images/generated/${adminId}/${fileName}`
  
  // Read template
  const templatePath = path.join(process.cwd(), 'assets', 'templates', 'default-header-template.svg')
  let template = fs.readFileSync(templatePath, 'utf-8')
  
  // Replace placeholders
  template = template.replace(/\[ADMIN_NAME\]/g, adminName)
  
  // Write personalized asset
  fs.writeFileSync(filePath, template)
  
  const stats = fs.statSync(filePath)
  
  return {
    asset_type: 'header_image',
    asset_name: `Header - ${adminName}`,
    file_path: relativePath,
    github_url: `https://github.com/shaniparacha2021/LabFinal/blob/main/${relativePath}`,
    file_size: stats.size,
    mime_type: 'image/svg+xml'
  }
}

/**
 * Generate personalized footer image
 */
async function generateFooterAsset(adminData: AdminAssetData, assetsDir: string): Promise<GeneratedAsset> {
  const { adminId, adminName, adminEmail, adminPhone } = adminData
  const fileName = `footer-${adminId}.svg`
  const filePath = path.join(assetsDir, fileName)
  const relativePath = `assets/images/generated/${adminId}/${fileName}`
  
  // Read template
  const templatePath = path.join(process.cwd(), 'assets', 'templates', 'default-footer-template.svg')
  let template = fs.readFileSync(templatePath, 'utf-8')
  
  // Replace placeholders
  template = template.replace(/\[ADMIN_NAME\]/g, adminName)
  template = template.replace(/\[ADMIN_EMAIL\]/g, adminEmail)
  template = template.replace(/\[ADMIN_PHONE\]/g, adminPhone || 'Not provided')
  
  // Write personalized asset
  fs.writeFileSync(filePath, template)
  
  const stats = fs.statSync(filePath)
  
  return {
    asset_type: 'footer_image',
    asset_name: `Footer - ${adminName}`,
    file_path: relativePath,
    github_url: `https://github.com/shaniparacha2021/LabFinal/blob/main/${relativePath}`,
    file_size: stats.size,
    mime_type: 'image/svg+xml'
  }
}

/**
 * Generate personalized watermark image
 */
async function generateWatermarkAsset(adminData: AdminAssetData, assetsDir: string): Promise<GeneratedAsset> {
  const { adminId, adminName } = adminData
  const fileName = `watermark-${adminId}.svg`
  const filePath = path.join(assetsDir, fileName)
  const relativePath = `assets/images/generated/${adminId}/${fileName}`
  
  // Read template
  const templatePath = path.join(process.cwd(), 'assets', 'templates', 'default-watermark-template.svg')
  let template = fs.readFileSync(templatePath, 'utf-8')
  
  // Replace placeholders
  template = template.replace(/\[ADMIN_NAME\]/g, adminName)
  
  // Write personalized asset
  fs.writeFileSync(filePath, template)
  
  const stats = fs.statSync(filePath)
  
  return {
    asset_type: 'watermark_image',
    asset_name: `Watermark - ${adminName}`,
    file_path: relativePath,
    github_url: `https://github.com/shaniparacha2021/LabFinal/blob/main/${relativePath}`,
    file_size: stats.size,
    mime_type: 'image/svg+xml'
  }
}

/**
 * Delete admin assets when admin is deleted
 */
export async function deleteAdminAssets(adminId: string): Promise<void> {
  const assetsDir = path.join(process.cwd(), 'assets', 'images', 'generated', adminId)
  
  if (fs.existsSync(assetsDir)) {
    fs.rmSync(assetsDir, { recursive: true, force: true })
  }
}
