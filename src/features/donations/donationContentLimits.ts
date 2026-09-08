/**
 * 기부 콘텐츠(캠페인·학교) 공통 글자수 제한.
 * 서버(payment-be) DonationCampaignRequest / DonationSchoolRequest 의 @Size(max) 와 동일하게 유지할 것.
 */

/** 이름(캠페인 제목·학교 이름) 최대 글자수. */
export const DONATION_NAME_MAX = 10;

/**
 * 상세 내용(캠페인 내용·학교 설명) 최대 글자수.
 * 화면에서 4줄이 꽉 차는 예시 문장 길이(공백 포함) 기준.
 */
export const DONATION_DESCRIPTION_MAX = 170;
