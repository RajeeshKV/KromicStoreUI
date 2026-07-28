# KromicStoreUI - Frontend Fixes & Implementation Guide

**Generated:** July 28, 2026
**Last Updated:** July 28, 2026 (Backend Image Upload Implementation)
**Purpose:** Comprehensive analysis of UI flow, API calls, and configuration issues requiring fixes/implementation

---

## Recent Backend Updates (July 28, 2026)

### ✅ Product Image Upload Support - FULLY IMPLEMENTED

**Backend Changes Completed:**
1. **ProductImage Entity** - Created new entity supporting multiple images per product
   - Location: `src/KromicStore.Domain/Entities/ProductImage.cs`
   - Properties: `ProductId`, `Url`, `CloudinaryPublicId`, `DisplayOrder`, `IsPrimary`, `AltText`

2. **Product Entity Updated** - Added images collection
   - Location: `src/KromicStore.Domain/Entities/Product.cs`
   - Added: `ICollection<ProductImage> Images`
   - Legacy `ImageUrl` field retained for backward compatibility

3. **Database Context Updated** - Added ProductImages table
   - Location: `src/KromicStore.Infrastructure/Data/AppDbContext.cs`
   - Configured relationships with cascade delete
   - Added indexes for performance

4. **MediaController Created** - Cloudinary image upload endpoints
   - Location: `src/KromicStore.API/Controllers/MediaController.cs`
   - Endpoints:
     - `POST /api/v1/media/upload` - Single image upload (max 10MB)
     - `POST /api/v1/media/upload/bulk` - Bulk image upload
     - `DELETE /api/v1/media/{publicId}` - Delete image from Cloudinary

5. **Product DTOs Updated** - Support for multiple images
   - `CreateProductRequest` - Added `List<ProductImageRequest> Images`
   - `UpdateProductRequest` - Added `List<ProductImageRequest> Images`
   - `ProductDto` - Added `List<ProductImageDto> Images`

6. **ProductService Updated** - Image handling logic
   - `CreateProductAsync` - Creates ProductImage entities from request
   - `UpdateProductAsync` - Replaces all images on update
   - Sets legacy `ImageUrl` to primary image for backward compatibility

**Frontend Integration Required:**
- Update ImageUpload component to use `/api/v1/media/upload`
- Update Products.tsx to handle multiple images with CloudinaryPublicId
- Update ProductDto interface to include images array
- Update product display to show image galleries

**Database Migration Required:**
- Run `dotnet ef migrations add AddProductImageTable` to create the ProductImages table
- Run `dotnet ef database update` to apply the migration

---

### ✅ Storefront Preview & Pending Changes - FULLY IMPLEMENTED

**Backend Changes Completed:**
1. **StoreController Updated** - Added preview endpoint
   - Location: `src/KromicStore.API/Controllers/StoreController.cs`
   - New endpoint: `GET /api/v1/store/preview` - Returns draft state for admin preview
   - Updated: `GET /api/v1/store/bootstrap` - Now only returns published storefronts
   - Public bootstrap throws error if storefront is not published

2. **StoreBootstrapService Updated** - Preview data method
   - Location: `src/KromicStore.Infrastructure/Services/StoreBootstrapService.cs`
   - Added: `GetPreviewDataAsync()` - Returns draft state including unpublished changes
   - Updated: `GetBootstrapDataAsync()` - Only returns published storefronts
   - Preview includes "(Preview)" suffix in site title

3. **StorefrontController Updated** - Pending changes endpoint
   - Location: `src/KromicStore.API/Controllers/StorefrontController.cs`
   - New endpoint: `GET /api/v1/storefronts/{id}/pending-changes`
   - Returns: `HasPendingChanges`, `Status`, `LastUpdated`, `LastPublished`, `Changes` list

4. **Storefront Entity Updated** - Published timestamp
   - Location: `src/KromicStore.Domain/Entities/Storefront.cs`
   - Added: `PublishedAt` property to track last publish time
   - Updated: `Publish()` method sets `PublishedAt` timestamp

5. **DTOs Updated** - Response objects
   - Location: `src/KromicStore.Contracts/V1/Storefront/StorefrontResponse.cs`
   - Added: `PublishedAt` to `StorefrontResponse`
   - Added: `PendingChangesResponse` with pending changes details

**Frontend Integration Required:**

**1. StorefrontSettings.tsx - Add Preview Button**
```typescript
// Add preview button component
const [showPreview, setShowPreview] = useState(false);
const [pendingChanges, setPendingChanges] = useState<any>(null);

// Load pending changes on component mount
useEffect(() => {
  const loadPendingChanges = async () => {
    if (storefrontId) {
      const res = await apiClient.get(`/api/v1/storefronts/${storefrontId}/pending-changes`);
      setPendingChanges(res.data);
    }
  };
  loadPendingChanges();
}, [storefrontId]);

// Preview button in header
{pendingChanges?.hasPendingChanges && (
  <Button variant="warning" onClick={() => setShowPreview(true)}>
    Preview Changes ({pendingChanges.changes.length})
  </Button>
)}

<Button variant="primary" onClick={() => setShowPreview(true)}>
  Preview Storefront
</Button>
```

**2. Preview Modal Component**
```typescript
// Create PreviewModal component
<Modal show={showPreview} onHide={() => setShowPreview(false)} size="xl">
  <Modal.Header closeButton>
    <Modal.Title>Storefront Preview</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <iframe
      src="/preview-storefront"
      style={{ width: '100%', height: '600px', border: 'none' }}
      title="Storefront Preview"
    />
  </Modal.Body>
  <Modal.Footer>
    {pendingChanges?.hasPendingChanges && (
      <Button variant="primary" onClick={handlePublish}>
        Publish Changes
      </Button>
    )}
    <Button variant="secondary" onClick={() => setShowPreview(false)}>
      Close
    </Button>
  </Modal.Footer>
</Modal>
```

**3. Preview Route Component**
```typescript
// Create PreviewStorefront.tsx component
// Uses /api/v1/store/preview endpoint instead of /api/v1/store/bootstrap
const PreviewStorefront = () => {
  const [bootstrapData, setBootstrapData] = useState(null);

  useEffect(() => {
    const loadPreview = async () => {
      const res = await apiClient.get('/api/v1/store/preview');
      setBootstrapData(res.data);
    };
    loadPreview();
  }, []);

  // Render storefront with preview data
  // Add visual indicator "PREVIEW MODE" at top
  return (
    <div className="preview-mode">
      <div className="preview-banner">
        ⚠️ PREVIEW MODE - Changes not published yet
      </div>
      <Storefront bootstrapData={bootstrapData} />
    </div>
  );
};
```

**4. Pending Changes Indicator**
```typescript
// Show pending changes badge
{pendingChanges?.hasPendingChanges && (
  <Badge variant="warning">
    {pendingChanges.changes.length} Pending Changes
  </Badge>
)}

// Show last published info
{pendingChanges?.lastPublished && (
  <small className="text-muted">
    Last published: {new Date(pendingChanges.lastPublished).toLocaleString()}
  </small>
)}
```

**5. Publish Flow with Preview**
```typescript
const handlePublish = async () => {
  try {
    // First validate
    const validation = await apiClient.get(`/api/v1/storefronts/${storefrontId}/validate`);
    if (!validation.data.isValid) {
      alert('Cannot publish: Missing required fields');
      return;
    }

    // Confirm with user
    if (!window.confirm('Are you sure you want to publish these changes?')) {
      return;
    }

    // Publish
    await apiClient.post(`/api/v1/storefronts/${storefrontId}/publish`);
    setShowPreview(false);
    loadStorefront(); // Reload storefront data
    loadPendingChanges(); // Reload pending changes
    alert('Storefront published successfully!');
  } catch (error) {
    alert('Failed to publish: ' + error.response?.data?.error);
  }
};
```

---

### ✅ About Us Page Configuration - ALREADY SUPPORTED

**Backend Status:**
The backend already supports configurable About Us content through the storefront page system.

**How It Works:**
1. **StorefrontPage Entity** - Can create custom pages with any slug (e.g., "about")
   - Location: `src/KromicStore.Domain/Entities/StorefrontPage.cs`
   - Properties: `Name`, `Slug`, `Description`, `LayoutType`, `Visibility`

2. **StorefrontSection Entity** - Sections within pages for organizing content
   - Location: `src/KromicStore.Domain/Entities/StorefrontSection.cs`
   - Properties: `Name`, `Description`, `BackgroundColor`, `BackgroundImageUrl`

3. **StorefrontComponent Entity** - Individual content components
   - Location: `src/KromicStore.Domain/Entities/StorefrontComponent.cs`
   - Component Types: `TextBlock`, `ImageBlock`, `VideoBlock`, `CustomHTML`, etc.
   - Config: `ComponentConfig` holds component-specific data

4. **Navigation** - About link already in bootstrap
   - Location: `src/KromicStore.Infrastructure/Services/StoreBootstrapService.cs`
   - Line 104: `new NavigationItem { Label = "About", Url = "/about", OpensInNewTab = false }`

**Frontend Integration Required:**

**1. Create About Us Page in StorefrontSettings**
```typescript
// Add to StorefrontSettings.tsx - Create About page
const handleCreateAboutPage = async () => {
  try {
    const aboutPage = {
      name: "About Us",
      slug: "about",
      description: "About our company",
      layoutType: "default",
      displayOrder: 2,
      visibility: "Published"
    };

    await apiClient.post(`/api/v1/storefronts/${storefrontId}/pages`, aboutPage);
    loadStorefront(); // Reload to show new page
  } catch (error) {
    alert('Failed to create About page: ' + error.response?.data?.error);
  }
};
```

**2. Add TextBlock Component for About Content**
```typescript
// Add text content to About page
const handleAddAboutContent = async (pageId: string, content: string) => {
  try {
    const section = {
      name: "About Content",
      description: "Main about us section",
      displayOrder: 0,
      isVisible: true
    };

    const sectionRes = await apiClient.post(
      `/api/v1/storefronts/${storefrontId}/pages/${pageId}/sections`,
      section
    );

    const component = {
      type: "TextBlock",
      config: {
        content: content,
        htmlContent: content, // For rich text
        enableRichText: true
      },
      displayOrder: 0,
      isVisible: true
    };

    await apiClient.post(
      `/api/v1/storefronts/${storefrontId}/pages/${pageId}/sections/${sectionRes.data.id}/components`,
      component
    );
  } catch (error) {
    alert('Failed to add content: ' + error.response?.data?.error);
  }
};
```

**3. Create AboutPage.tsx Component**
```typescript
// Create src/pages/AboutPage.tsx
import { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';

const AboutPage = () => {
  const [pageData, setPageData] = useState(null);

  useEffect(() => {
    const loadAboutPage = async () => {
      try {
        // Get storefront pages and find "about" slug
        const res = await apiClient.get('/api/v1/store/bootstrap');
        const aboutPage = res.data.homepage?.pages?.find(p => p.slug === 'about');
        setPageData(aboutPage);
      } catch (error) {
        console.error('Failed to load About page');
      }
    };
    loadAboutPage();
  }, []);

  if (!pageData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="about-page">
      {pageData.sections?.map(section => (
        <section key={section.id} className={section.cssClass}>
          {section.components?.map(component => (
            <div key={component.id} className={component.cssClass}>
              {component.type === 'TextBlock' && (
                <div dangerouslySetInnerHTML={{ __html: component.config.content }} />
              )}
              {component.type === 'ImageBlock' && (
                <img src={component.config.imageUrl} alt={component.config.altText} />
              )}
              {/* Add other component types as needed */}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
};

export default AboutPage;
```

**4. Add Rich Text Editor for About Content**
```typescript
// Use a rich text editor like react-quill or draft-js
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const AboutContentEditor = ({ content, onChange }) => {
  return (
    <ReactQuill
      value={content}
      onChange={onChange}
      modules={{
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['link', 'image'],
          ['clean']
        ]
      }}
      formats={[
        'header', 'bold', 'italic', 'underline', 'strike',
        'list', 'bullet', 'link', 'image'
      ]}
    />
  );
};
```

**5. StorefrontSettings UI for About Page**
```typescript
// Add to StorefrontSettings.tsx
<div className="about-page-config">
  <h3>About Us Page</h3>
  {aboutPage ? (
    <>
      <Button variant="secondary" onClick={() => setShowAboutEditor(true)}>
        Edit About Content
      </Button>
      <Button variant="danger" onClick={() => handleDeleteAboutPage()}>
        Delete About Page
      </Button>
    </>
  ) : (
    <Button variant="primary" onClick={handleCreateAboutPage}>
      Create About Page
    </Button>
  )}
</div>

// Modal for editing About content
<Modal show={showAboutEditor} onHide={() => setShowAboutEditor(false)}>
  <Modal.Header closeButton>
    <Modal.Title>Edit About Us Content</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <AboutContentEditor
      content={aboutContent}
      onChange={setAboutContent}
    />
  </Modal.Body>
  <Modal.Footer>
    <Button variant="primary" onClick={handleSaveAboutContent}>
      Save Changes
    </Button>
    <Button variant="secondary" onClick={() => setShowAboutEditor(false)}>
      Cancel
    </Button>
  </Modal.Footer>
</Modal>
```

**Available Component Types for About Page:**
- `TextBlock` - Rich text content
- `ImageBlock` - Company logo, team photos
- `VideoBlock` - Company video
- `CustomHTML` - Custom HTML content
- `ButtonBlock` - CTA buttons
- `SocialLinks` - Social media links
- `ContactForm` - Contact form

**API Endpoints Needed (verify existence):**
- `POST /api/v1/storefronts/{id}/pages` - Create page
- `PUT /api/v1/storefronts/{id}/pages/{pageId}` - Update page
- `DELETE /api/v1/storefronts/{id}/pages/{pageId}` - Delete page
- `POST /api/v1/storefronts/{id}/pages/{pageId}/sections` - Create section
- `POST /api/v1/storefronts/{id}/pages/{pageId}/sections/{sectionId}/components` - Create component

---

### 1. StorefrontSettings Page - Wrong Endpoints

**File:** `src/pages/TenantAdmin/StorefrontSettings.tsx`

**Issues:**
- **Line 42:** `GET /api/v1/storefront` - ❌ Endpoint does not exist
- **Line 134:** `PUT /api/v1/storefront` - ❌ Endpoint does not exist  
- **Line 158:** `POST /api/v1/storefront/publish` - ❌ Endpoint does not exist

**Correct Backend Endpoints:**
- `GET /api/v1/storefronts/{id}` - Get specific storefront by ID
- `PUT /api/v1/storefronts/{id}` - Update storefront by ID
- `POST /api/v1/storefronts/{id}/publish` - Publish storefront by ID
- `GET /api/v1/storefronts` - List all storefronts for tenant

**Required Changes:**
```typescript
// Load settings - needs storefront ID
const res = await apiClient.get(`/api/v1/storefronts/${storefrontId}`);

// Save settings - needs storefront ID
await apiClient.put(`/api/v1/storefronts/${storefrontId}`, payload);

// Publish - needs storefront ID
await apiClient.post(`/api/v1/storefronts/${storefrontId}/publish`);
```

**Additional Fix Needed:**
- Storefront ID must be stored/retrieved (currently missing from state)
- Add state for `storefrontId` and load it on component mount

---

### 2. ImageUpload Component - Non-Existent Upload Endpoint ✅ RESOLVED

**File:** `src/components/ImageUpload.tsx`

**Status:** ✅ **RESOLVED** - MediaController has been implemented

**Previous Issue:**
- **Line 39:** `POST /api/v1/upload` - ❌ Endpoint did not exist in backend
- No `MediaController` existed in the backend API
- Currently falls back to local object URL simulation (line 61-62)

**Backend Implementation Completed:**
- ✅ Created `MediaController.cs` at `src/KromicStore.API/Controllers/MediaController.cs`
- ✅ Endpoints now available:
  - `POST /api/v1/media/upload` - Single image upload (max 10MB)
  - `POST /api/v1/media/upload/bulk` - Bulk image upload
  - `DELETE /api/v1/media/{publicId}` - Delete image from Cloudinary

**Frontend Fix Required:**
```typescript
// Update ImageUpload.tsx line 39
const res = await apiClient.post('/api/v1/media/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Response structure:
{
  url: string,           // Cloudinary secure URL
  publicId: string,      // Cloudinary public ID for deletion
  fileSize: number,      // File size in bytes
  contentType: string    // MIME type
}
```

---

### 3. Products Page - Image Upload Mismatch ✅ RESOLVED

**File:** `src/pages/TenantAdmin/Products.tsx`

**Status:** ✅ **RESOLVED** - Backend now supports multiple images per product

**Previous Issues:**
- **Line 100:** Sending `images: [{ url, displayOrder }]` array in payload
- Backend `Product` entity only had single `ImageUrl` field
- No support for multiple images per product
- ImageUpload component uses non-existent `/api/v1/upload` endpoint

**Backend Implementation Completed:**
- ✅ Created `ProductImage` entity at `src/KromicStore.Domain/Entities/ProductImage.cs`
  - Properties: `ProductId`, `Url`, `CloudinaryPublicId`, `DisplayOrder`, `IsPrimary`, `AltText`
- ✅ Updated `Product` entity to include `ICollection<ProductImage> Images`
- ✅ Updated `AppDbContext` to include `ProductImages` DbSet with proper relationships
- ✅ Updated `CreateProductRequest` to include `List<ProductImageRequest> Images`
- ✅ Updated `UpdateProductRequest` to include `List<ProductImageRequest> Images`
- ✅ Updated `ProductDto` to include `List<ProductImageDto> Images`
- ✅ Updated `ProductService.CreateProductAsync` to handle image creation
- ✅ Updated `ProductService.UpdateProductAsync` to handle image replacement

**Frontend Changes Required:**

**1. Update ImageUpload to use new endpoint:**
```typescript
// In ImageUpload.tsx, update line 39
const res = await apiClient.post('/api/v1/media/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Update response handling (lines 51-56)
const url = res.data?.url || res.data?.Url;
const publicId = res.data?.publicId || res.data?.PublicId;
if (url && publicId) {
  onChange({ url, publicId }); // Return both url and publicId
}
```

**2. Update Products.tsx to handle multiple images:**
```typescript
// Add state for multiple images
const [productImages, setProductImages] = useState<Array<{url: string, publicId: string, displayOrder: number, isPrimary: boolean}>>([]);

// Update handleSaveProduct payload
const payload = {
  name,
  sku,
  price: Number(price),
  stock: Number(stock),
  reorderLevel: Number(reorderLevel),
  categoryId: categoryId || null,
  description,
  images: productImages.map(img => ({
    url: img.url,
    cloudinaryPublicId: img.publicId,
    displayOrder: img.displayOrder,
    isPrimary: img.isPrimary,
    altText: `${name} image ${img.displayOrder + 1}`
  }))
};
```

**3. Update ProductDto interface:**
```typescript
// Add images to ProductDto interface
interface ProductDto {
  // ... existing fields
  images: Array<{
    id: string;
    url: string;
    cloudinaryPublicId: string;
    displayOrder: number;
    isPrimary: boolean;
    altText?: string;
  }>;
}
```

**4. Update product display to show multiple images:**
```typescript
// In product list/grid, show primary image or first image
const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
<img src={primaryImage?.url || product.imageUrl} alt={product.name} />

// In product detail, show all images with a gallery
{product.images?.map(img => (
  <img key={img.id} src={img.url} alt={img.altText} />
))}
```

---

### 4. Orders Page - Ship Endpoint Issue

**File:** `src/pages/TenantAdmin/Orders.tsx`

**Issue:**
- **Line 204:** `POST /api/v1/orders/${shipOrderId}/ship` - ❌ May not exist
- Backend OrderController needs verification for ship endpoint structure

**Required Verification:**
Check backend `OrderController.cs` for actual ship endpoint:
- If exists: Verify parameter structure (tracking number, courier ID)
- If doesn't exist: Implement backend endpoint

**Expected Backend Endpoint:**
```csharp
[HttpPost("{id}/ship")]
public async Task<IActionResult> ShipOrder(Guid id, [FromBody] ShipOrderRequest request)
{
    // request should contain trackingNumber, courierId
}
```

---

### 5. Config Page - Redundant Idempotency Key

**File:** `src/pages/TenantAdmin/Config.tsx`

**Issue:**
- **Lines 67-70:** Manually adding `Idempotency-Key` header only for `store:name`
- **apiClient.ts** interceptor (lines 53-59) already adds Idempotency-Key for all POST/PUT/DELETE requests
- Redundant code creates potential conflicts

**Fix:**
Remove manual Idempotency-Key header:
```typescript
// Remove lines 67-70
const headers: any = {}; // Remove conditional idempotency logic
await apiClient.put(`/api/v1/config/${key}`, { value }, { headers });
```

---

## Authentication & Authorization Issues

### 6. AuthContext - SuperUser Detection Logic

**File:** `src/contexts/AuthContext.tsx`

**Issue:**
- **Line 111:** Hardcoded email check: `email === 'admin@kromicstore.com' || email === 'admin@kromic-store.com'`
- **Line 119:** Role parsing from JWT may not match backend claim structure
- **Line 126:** Defaulting to `TenantAdmin` role if no roles found

**Concerns:**
- Hardcoded emails are not scalable
- Role detection should rely solely on JWT claims
- Default role assignment may mask authentication issues

**Recommended Fix:**
```typescript
// Remove hardcoded email check
const isSuperEmail = false; // Remove this

// Rely only on JWT claims
const claimRole = claims?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || claims?.role;
const parsedRoles = Array.isArray(claimRole) ? claimRole : claimRole ? [claimRole] : [];

// If no roles found, it's an auth error - don't default
if (parsedRoles.length === 0) {
  throw new Error('No roles found in JWT token');
}

const isSuper = parsedRoles.includes('SuperUser');
const userRoles = parsedRoles;
```

---

### 7. apiClient - Token Refresh Logic

**File:** `src/api/apiClient.ts`

**Issue:**
- **Line 119:** SuperUser detection uses same hardcoded logic as AuthContext
- **Line 123:** Refresh path determination based on SuperUser check

**Concern:**
- Duplicate SuperUser detection logic
- Should use stored user role instead of re-detecting

**Recommended Fix:**
```typescript
// Check stored user role instead of email
const storedUser = localStorage.getItem('user');
if (storedUser) {
  const parsedUser = JSON.parse(storedUser);
  isSuperUser = parsedUser.roles?.includes('SuperUser');
}
```

---

## Missing Features & Gaps

### 8. No Subscription Management UI

**Backend Endpoints Available:**
- `GET /api/v1/subscriptions/current` - Get current subscription
- `GET /api/v1/subscriptions/current/usage` - Get usage summary
- `POST /api/v1/subscriptions/upgrade` - Upgrade plan
- `POST /api/v1/subscriptions/downgrade` - Downgrade plan

**Frontend Status:**
- ❌ No subscription management page exists
- ❌ No usage dashboard
- ❌ No plan upgrade/downgrade UI

**Required Implementation:**
Create `src/pages/TenantAdmin/Subscription.tsx` with:
- Current plan display
- Usage metrics (products, users, API calls)
- Upgrade/downgrade buttons
- Billing history

---

### 9. No Customer Management UI

**Backend Endpoints Available:**
- `GET /api/v1/customers` - List customers
- `GET /api/v1/customers/{id}` - Get customer details
- `POST /api/v1/customers` - Create customer

**Frontend Status:**
- ❌ No customer management page
- ❌ No customer list/details view

**Required Implementation:**
Create `src/pages/TenantAdmin/Customers.tsx`

---

### 10. No Team Management UI

**Backend Endpoints Available:**
- `GET /api/v1/team` - List team members
- `POST /api/v1/team/invite` - Invite team member
- `DELETE /api/v1/team/{id}` - Remove team member

**Frontend Status:**
- ❌ No team management page
- TeamInvitation.tsx exists but may not be integrated

**Required Implementation:**
Create `src/pages/TenantAdmin/Team.tsx`

---

### 11. No Domain Management Integration

**Backend Endpoints Available:**
- `GET /api/v1/domains` - List domains
- `POST /api/v1/domains` - Add custom domain
- `POST /api/v1/domains/{id}/verify` - Verify domain
- `DELETE /api/v1/domains/{id}` - Remove domain

**Frontend Status:**
- `Domains.tsx` exists but needs verification of API integration

**Required Verification:**
Check if `Domains.tsx` correctly uses:
- `GET /api/v1/domains` (not `/api/v1/domain`)
- Correct payload structure for domain operations

---

## Configuration Issues

### 12. Environment Variables

**File:** `.env`

**Current:**
```
VITE_API_URL=https://kromicstoreapi.onrender.com
```

**Issues:**
- No fallback for local development
- No environment-specific configs

**Recommended:**
```bash
# Production
VITE_API_URL=https://kromicstoreapi.onrender.com

# Development (create .env.development)
VITE_API_URL=http://localhost:5000
```

---

### 13. API Base URL Fallback

**File:** `src/api/apiClient.ts`

**Line 5:** `export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://kromicstoreapi.onrender.com';`

**Issue:**
- Hardcoded fallback to production URL
- Should fallback to localhost for development

**Fix:**
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:5000' : 'https://kromicstoreapi.onrender.com');
```

---

## Data Flow Issues

### 14. Storefront Bootstrap Data

**File:** `src/pages/Storefront.tsx`

**Line 92:** `GET /api/v1/store/bootstrap`

**Backend Status:**
- ✅ Endpoint exists in `StoreController.cs`
- ✅ Returns tenant, theme, navigation, homepage, features, SEO data

**Issue:**
- No error handling for missing tenant context
- Bootstrap may fail silently if tenant not resolved

**Recommended Enhancement:**
Add better error handling and fallback:
```typescript
try {
  const res = await apiClient.get('/api/v1/store/bootstrap');
  // Process bootstrap data
} catch (error) {
  // Fallback to default theme if bootstrap fails
  console.warn('Bootstrap failed, using defaults');
  setBootstrapData(getDefaultBootstrapData());
}
```

---

### 15. Tenant Resolution

**File:** `src/api/publicApi.ts`

**Line 15:** `GET /api/v1/public/tenant/by-subdomain`

**Backend Status:**
- ✅ Endpoint exists in `PublicController.cs`
- ✅ Returns tenant ID, name, subdomain

**Issue:**
- No caching of resolved tenant
- Repeated calls for same subdomain

**Recommended Enhancement:**
Add caching:
```typescript
const tenantCache = new Map<string, TenantResolutionResponse>();

export async function resolveTenantBySubdomain(subdomain: string) {
  if (tenantCache.has(subdomain)) {
    return tenantCache.get(subdomain)!;
  }
  
  const response = await apiClient.get('/api/v1/public/tenant/by-subdomain', {
    params: { subdomain }
  });
  
  const data = response.data.data;
  tenantCache.set(subdomain, data);
  return data;
}
```

---

## UI/UX Issues

### 16. Loading States

**Multiple Files:**
- Many components use basic loading spinners
- No skeleton screens for better perceived performance

**Recommended:**
Implement skeleton loading components for:
- Products list
- Orders list  
- Categories tree
- Dashboard stats

---

### 17. Error Handling

**Multiple Files:**
- Generic error messages
- No retry mechanisms for failed requests
- No offline detection

**Recommended:**
- Add retry logic with exponential backoff
- Implement offline detection and queueing
- Show specific error messages based on error type

---

### 18. Form Validation

**Multiple Files:**
- Basic HTML5 validation only
- No custom validation logic
- No real-time validation feedback

**Recommended:**
- Implement form validation library (react-hook-form, zod)
- Add real-time validation
- Show field-specific error messages

---

## Security Issues

### 19. XSS Prevention

**Files:**
- Multiple components use `dangerouslySetInnerHTML` not found (good)
- But user-generated content should be sanitized

**Recommended:**
- Implement DOMPurify for sanitizing user content
- Validate all user inputs before rendering

---

### 20. CSRF Protection

**Status:**
- No CSRF token implementation visible
- Backend may require CSRF for state-changing requests

**Recommended:**
- Verify if backend requires CSRF tokens
- Implement CSRF token handling if needed

---

## Performance Issues

### 21. Image Optimization

**Status:**
- No image lazy loading (Storefront.tsx line 349 has lazy loading - good)
- No image optimization
- No responsive images

**Recommended:**
- Implement responsive image sizes
- Add WebP format support
- Use Cloudinary transformations for optimization

---

### 22. Bundle Size

**Status:**
- No code splitting visible
- All components loaded upfront

**Recommended:**
- Implement route-based code splitting
- Lazy load heavy components
- Use dynamic imports for non-critical features

---

## Priority Implementation Order

### Phase 1 - Critical Fixes (Immediate)
1. ~~Implement MediaController for image uploads (Issue #2)~~ ✅ **COMPLETED**
2. ~~Fix Products page image handling (Issue #3)~~ ✅ **BACKEND COMPLETED - Frontend pending**
3. ~~Add storefront preview & pending changes~~ ✅ **BACKEND COMPLETED - Frontend pending**
4. Fix StorefrontSettings API endpoints (Issue #1)
5. Verify/fix Orders ship endpoint (Issue #4)
6. Remove redundant idempotency key (Issue #5)
7. **NEW: Create database migration for ProductImage table**
8. **NEW: Create database migration for Storefront PublishedAt field**

### Phase 2 - Frontend Image Upload Integration (Week 1)
9. Update ImageUpload component to use `/api/v1/media/upload` endpoint
10. Update Products.tsx to handle multiple images with CloudinaryPublicId
11. Update ProductDto interface to include images array
12. Update product display components to show image galleries

### Phase 3 - Frontend Storefront Preview Integration (Week 2)
13. Add preview button to StorefrontSettings.tsx
14. Create PreviewModal component for storefront preview
15. Create PreviewStorefront.tsx route component using /api/v1/store/preview
16. Add pending changes indicator badge
17. Implement publish flow with preview validation

### Phase 4 - Authentication Improvements (Week 3)
18. Fix AuthContext SuperUser detection (Issue #6)
19. Fix apiClient token refresh logic (Issue #7)
20. Add environment-specific configs (Issue #12, #13)

### Phase 5 - Missing Features (Week 4)
21. Implement Subscription management UI (Issue #8)
22. Implement Customer management UI (Issue #9)
23. Implement Team management UI (Issue #10)
24. Verify Domain management integration (Issue #11)

### Phase 6 - Enhancements (Week 5)
25. Improve error handling and retry logic (Issue #17)
26. Add tenant resolution caching (Issue #15)
27. Implement form validation (Issue #18)

### Phase 7 - Performance & Security (Week 6)
28. Implement code splitting (Issue #22)
29. Add image optimization (Issue #21)
30. Implement XSS prevention (Issue #19)

---

## Testing Recommendations

### Unit Tests
- Test API client interceptors
- Test AuthContext logic
- Test utility functions

### Integration Tests
- Test API integration for each page
- Test authentication flow
- Test error scenarios

### E2E Tests
- Test critical user flows:
  - Login → Dashboard → Create Product
  - Configure Storefront → Publish
  - Order fulfillment flow

---

## Backend API Documentation References

Refer to backend controllers for correct endpoint structures:
- `StorefrontController.cs` - `/api/v1/storefronts/*`
- `ProductController.cs` - `/api/v1/products/*`
- `OrderController.cs` - `/api/v1/orders/*`
- `ConfigController.cs` - `/api/v1/config/*`
- `PublicController.cs` - `/api/v1/public/*`
- `SubscriptionController.cs` - `/api/v1/subscriptions/*`

---

## Notes

- All API endpoints require `X-Tenant-Id` header (handled by apiClient interceptor)
- All mutation endpoints require `Idempotency-Key` header (handled by apiClient interceptor)
- Authentication uses JWT Bearer tokens (handled by apiClient interceptor)
- Token refresh is automatic on 401 responses (handled by apiClient interceptor)

---

**Document Version:** 1.0  
**Last Updated:** July 28, 2026
