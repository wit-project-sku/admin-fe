import type { DonationCampaignMultipartFiles } from '../hooks/donation-api/donationApiTypes';

export const buildProductMultipart = (data: unknown, images: (File | Blob | null | undefined)[] | undefined): FormData => {
  const formData = new FormData();

  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));

  if (Array.isArray(images)) {
    images.filter(Boolean).forEach((file) => {
      if (file) formData.append('images', file);
    });
  }

  return formData;
};

/** Multipart: `data` (JSON) + optional `image` + optional `sectionImage_<i>` per section index. */
export const buildDonationCampaignMultipart = (
  data: unknown,
  files?: DonationCampaignMultipartFiles | File | null,
): FormData => {
  const formData = new FormData();
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));

  const normalized: DonationCampaignMultipartFiles =
    files instanceof File || files == null ? { image: files ?? null } : (files ?? {});

  if (normalized.image) {
    formData.append('image', normalized.image);
  }

  if (normalized.sectionImages) {
    Object.entries(normalized.sectionImages).forEach(([index, file]) => {
      if (file) formData.append(`sectionImage_${index}`, file);
    });
  }

  return formData;
};
