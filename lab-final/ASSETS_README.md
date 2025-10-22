# Asset Management System

This document explains how multimedia assets and files are managed in the Lab Management System.

## 📁 File Storage Structure

All assets are stored in the `public/assets/` directory with the following structure:

```
public/assets/
├── images/          # User photos, patient photos, doctor photos
├── reports/         # Generated PDF reports
├── branding/        # Lab logos, headers, footers, watermarks
├── templates/       # Test template files
└── uploads/         # General file uploads
```

## 🗄️ Database Storage

**Only file names are stored in the Supabase database**, not full URLs or file paths.

### Database Fields for File Names:

#### Tenant (Lab) Branding:
- `logo_filename` - Lab logo file name
- `header_filename` - Report header image
- `footer_filename` - Report footer image  
- `watermark_filename` - Report watermark image

#### Patient Management:
- `photo_filename` - Patient profile photo

#### Doctor Management:
- `photo_filename` - Doctor profile photo

#### Report Management:
- `pdf_filename` - Generated PDF report file

## 🔧 File Management Functions

### AssetManager Class
Located in `src/lib/file-utils.ts`

```typescript
// Upload a file and get filename
const { filename, path, url } = await AssetManager.uploadFile(
  file, 
  'images', 
  'patient' // optional prefix
)

// Get asset URL
const imageUrl = AssetManager.getAssetUrl('images', filename)

// Get asset path
const assetPath = AssetManager.getAssetPath('branding', filename)
```

### File Upload Component
Located in `src/components/ui/file-upload.tsx`

```tsx
<FileUpload
  onFileSelect={(file) => handleFileSelect(file)}
  onFileRemove={() => handleFileRemove()}
  selectedFile={selectedFile}
  accept="image/*"
  maxSize={5 * 1024 * 1024} // 5MB
  allowedTypes={FILE_TYPES.IMAGE}
  placeholder="Upload patient photo"
/>
```

### Image Display Component
Located in `src/components/ui/image-display.tsx`

```tsx
<ImageDisplay
  filename="patient_photo_1234567890_abc123.jpg"
  type="images"
  alt="Patient Photo"
  className="w-32 h-32 rounded-lg"
  showRemove={true}
  onRemove={() => handleRemove()}
/>

<Avatar
  filename="doctor_photo_1234567890_xyz789.jpg"
  name="Dr. John Smith"
  size="lg"
/>
```

## 📝 File Naming Convention

Files are automatically renamed using the following pattern:
```
{prefix}_{original_name}_{timestamp}_{random}.{extension}
```

Examples:
- `patient_john_doe_1234567890_abc123.jpg`
- `lab_logo_1234567890_xyz789.png`
- `report_blood_test_1234567890_def456.pdf`

## 🔒 File Validation

### Supported File Types:
- **Images**: jpg, jpeg, png, gif, webp, svg
- **PDFs**: pdf
- **Documents**: doc, docx, txt
- **Excel**: xls, xlsx, csv

### File Size Limits:
- **Images**: 5MB (configurable)
- **PDFs**: 10MB (configurable)
- **Documents**: 5MB (configurable)

## 🌐 URL Generation

Assets are accessed via URLs like:
```
https://yourdomain.com/assets/images/patient_photo_1234567890_abc123.jpg
https://yourdomain.com/assets/branding/lab_logo_1234567890_xyz789.png
https://yourdomain.com/assets/reports/report_1234567890_def456.pdf
```

## 🚀 Benefits of This Approach

1. **Free Storage**: No external storage costs
2. **Version Control**: All assets are tracked in Git
3. **Fast Access**: Direct file serving from CDN
4. **Simple Management**: Easy to backup and migrate
5. **Database Efficiency**: Only store filenames, not full URLs
6. **Scalability**: Can easily move to cloud storage later

## 📋 Usage Examples

### Upload Patient Photo:
```typescript
const handleFileUpload = async (file: File) => {
  const { filename } = await AssetManager.uploadFile(file, 'images', 'patient')
  
  // Save filename to database
  await updatePatient(patientId, { photo_filename: filename })
}
```

### Display Lab Logo:
```tsx
{tenant.logo_filename && (
  <ImageDisplay
    filename={tenant.logo_filename}
    type="branding"
    alt={`${tenant.name} Logo`}
    className="h-16 w-auto"
  />
)}
```

### Generate Report PDF:
```typescript
const generateReport = async (reportId: string) => {
  // Generate PDF
  const pdfBuffer = await generatePDF(reportData)
  
  // Save PDF file
  const filename = `report_${reportId}_${Date.now()}.pdf`
  await saveFile(pdfBuffer, 'reports', filename)
  
  // Update database with filename
  await updateReport(reportId, { pdf_filename: filename })
}
```

## 🔄 Migration Strategy

If you need to move to cloud storage later:
1. Upload files to cloud storage (AWS S3, Cloudinary, etc.)
2. Update `getAssetUrl()` function to return cloud URLs
3. Database structure remains unchanged
4. All existing code continues to work

This approach provides maximum flexibility while keeping costs minimal during development and early deployment.
