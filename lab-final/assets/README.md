# 🎨 **Lab Management System - Asset Storage**

This directory contains all multimedia assets for the Lab Management System. Assets are organized by type and assigned to specific admins.

## 📁 **Directory Structure**

```
assets/
├── images/
│   ├── headers/          # Header images for lab interfaces
│   ├── footers/          # Footer images for lab interfaces
│   └── watermarks/       # Watermark images for lab content
└── README.md            # This file
```

## 🎯 **Asset Types**

### 1. **Header Images** (`headers/`)
- **Purpose**: Main header images displayed at the top of lab interfaces
- **Format**: PNG, JPG, SVG
- **Recommended Size**: 1200x200px or similar aspect ratio
- **Naming Convention**: `header-lab-[admin-id]-[version].png`

### 2. **Footer Images** (`footers/`)
- **Purpose**: Footer images displayed at the bottom of lab interfaces
- **Format**: PNG, JPG, SVG
- **Recommended Size**: 1200x150px or similar aspect ratio
- **Naming Convention**: `footer-lab-[admin-id]-[version].png`

### 3. **Watermark Images** (`watermarks/`)
- **Purpose**: Watermark overlays for lab content and documents
- **Format**: PNG (with transparency)
- **Recommended Size**: 200x200px or similar
- **Naming Convention**: `watermark-lab-[admin-id]-[version].png`

## 📋 **Asset Assignment Process**

1. **Upload Assets**: Place asset files in appropriate directories
2. **Record in Database**: Use the Admin Management system to assign assets
3. **File Path Format**: `assets/images/[type]/[filename]`
4. **GitHub URL Format**: `https://github.com/shaniparacha2021/LabFinal/blob/main/assets/images/[type]/[filename]`

## 🔗 **Example Asset Paths**

### Header Images:
- **File Path**: `assets/images/headers/header-lab-admin1-v1.png`
- **GitHub URL**: `https://github.com/shaniparacha2021/LabFinal/blob/main/assets/images/headers/header-lab-admin1-v1.png`

### Footer Images:
- **File Path**: `assets/images/footers/footer-lab-admin1-v1.png`
- **GitHub URL**: `https://github.com/shaniparacha2021/LabFinal/blob/main/assets/images/footers/footer-lab-admin1-v1.png`

### Watermark Images:
- **File Path**: `assets/images/watermarks/watermark-lab-admin1-v1.png`
- **GitHub URL**: `https://github.com/shaniparacha2021/LabFinal/blob/main/assets/images/watermarks/watermark-lab-admin1-v1.png`

## 📝 **Asset Management Guidelines**

### ✅ **Best Practices:**
- Use descriptive filenames with admin ID and version
- Optimize images for web (compress without losing quality)
- Use appropriate formats (PNG for transparency, JPG for photos)
- Keep file sizes reasonable (< 2MB per image)
- Maintain consistent naming conventions

### 🚫 **Avoid:**
- Large file sizes that slow down loading
- Inconsistent naming conventions
- Storing assets outside the designated directories
- Using copyrighted images without permission

## 🔄 **Version Control**

- All assets are versioned with the repository
- Use version numbers in filenames (v1, v2, etc.)
- Update database records when replacing assets
- Keep old versions for rollback capability

## 🎨 **Sample Assets**

The following sample assets are provided for testing:

### Header Images:
- `sample-header-lab-1.png` - Sample header for Lab 1
- `sample-header-lab-2.png` - Sample header for Lab 2

### Footer Images:
- `sample-footer-lab-1.png` - Sample footer for Lab 1
- `sample-footer-lab-2.png` - Sample footer for Lab 2

### Watermark Images:
- `sample-watermark-lab-1.png` - Sample watermark for Lab 1
- `sample-watermark-lab-2.png` - Sample watermark for Lab 2

## 🔧 **Integration with Admin Management**

Assets are assigned to admins through the Super Admin dashboard:

1. **Navigate to**: Super Admin → Admin Management
2. **Select Admin**: Choose the admin to assign assets to
3. **Manage Assets**: Click "Manage Assets" button
4. **Assign Asset**: Use the asset form to assign assets
5. **Enter Details**:
   - Asset Type: Select header, footer, or watermark
   - Asset Name: Descriptive name
   - File Path: Relative path from repository root
   - GitHub URL: Direct link to asset in GitHub
   - File Size: Size in bytes (optional)
   - MIME Type: Image format (optional)

## 📊 **Database Storage**

Only metadata is stored in the Supabase database:
- Asset name and type
- File path and GitHub URL
- File size and MIME type
- Assignment to specific admin
- Active/inactive status

**No binary data is stored in the database** - all actual files remain in this GitHub repository.

---

**Last Updated**: October 2024  
**Repository**: https://github.com/shaniparacha2021/LabFinal  
**Maintained By**: Lab Management System Team
