import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CampaignInput,
  AdSetInput,
  AdInput,
  MetaAdAccount,
  MetaPage,
  SubmissionProgress,
} from "@/lib/meta-types";
import type { MetaCampaign } from "@/lib/meta-api";

interface BulkStore {
  // Account settings
  adAccounts: MetaAdAccount[];
  selectedAdAccountId: string;
  pages: MetaPage[];
  selectedPageId: string;
  selectedPageAccessToken: string;

  // Existing campaigns from Meta
  existingCampaigns: MetaCampaign[];
  selectedExistingCampaignId: string;

  // Ad data
  campaigns: CampaignInput[];

  // Image files (not persisted)
  imageFiles: Map<string, File>;

  // Submission progress
  submissionProgress: SubmissionProgress | null;
  isSubmitting: boolean;

  // Actions
  setAdAccounts: (accounts: MetaAdAccount[]) => void;
  setSelectedAdAccount: (id: string) => void;
  setPages: (pages: MetaPage[]) => void;
  setSelectedPage: (id: string, accessToken: string) => void;
  setExistingCampaigns: (campaigns: MetaCampaign[]) => void;
  setSelectedExistingCampaign: (id: string) => void;
  setCampaigns: (campaigns: CampaignInput[]) => void;
  addCampaign: (campaign: CampaignInput) => void;
  updateCampaign: (index: number, campaign: CampaignInput) => void;
  removeCampaign: (index: number) => void;
  addAdSet: (campaignIndex: number, adSet: AdSetInput) => void;
  addAd: (campaignIndex: number, adSetIndex: number, ad: AdInput) => void;
  addImageFile: (filename: string, file: File) => void;
  addImageFiles: (files: File[]) => void;
  removeImageFile: (filename: string) => void;
  setSubmissionProgress: (progress: SubmissionProgress | null) => void;
  setIsSubmitting: (submitting: boolean) => void;
  reset: () => void;
}

export const useBulkStore = create<BulkStore>()(
  persist(
    (set) => ({
      adAccounts: [],
      selectedAdAccountId: "",
      pages: [],
      selectedPageId: "",
      selectedPageAccessToken: "",
      existingCampaigns: [],
      selectedExistingCampaignId: "",
      campaigns: [],
      imageFiles: new Map<string, File>(),
      submissionProgress: null,
      isSubmitting: false,

      setAdAccounts: (accounts) => set({ adAccounts: accounts }),
      setSelectedAdAccount: (id) => set({ selectedAdAccountId: id }),
      setPages: (pages) => set({ pages }),
      setSelectedPage: (id, accessToken) =>
        set({ selectedPageId: id, selectedPageAccessToken: accessToken }),
      setExistingCampaigns: (campaigns) => set({ existingCampaigns: campaigns }),
      setSelectedExistingCampaign: (id) => set({ selectedExistingCampaignId: id }),
      setCampaigns: (campaigns) => set({ campaigns }),
      addCampaign: (campaign) =>
        set((state) => ({ campaigns: [...state.campaigns, campaign] })),
      updateCampaign: (index, campaign) =>
        set((state) => {
          const campaigns = [...state.campaigns];
          campaigns[index] = campaign;
          return { campaigns };
        }),
      removeCampaign: (index) =>
        set((state) => ({
          campaigns: state.campaigns.filter((_, i) => i !== index),
        })),
      addAdSet: (campaignIndex, adSet) =>
        set((state) => {
          const campaigns = [...state.campaigns];
          campaigns[campaignIndex] = {
            ...campaigns[campaignIndex],
            adSets: [...campaigns[campaignIndex].adSets, adSet],
          };
          return { campaigns };
        }),
      addAd: (campaignIndex, adSetIndex, ad) =>
        set((state) => {
          const campaigns = [...state.campaigns];
          const adSets = [...campaigns[campaignIndex].adSets];
          adSets[adSetIndex] = {
            ...adSets[adSetIndex],
            ads: [...adSets[adSetIndex].ads, ad],
          };
          campaigns[campaignIndex] = { ...campaigns[campaignIndex], adSets };
          return { campaigns };
        }),
      addImageFile: (filename, file) =>
        set((state) => {
          const imageFiles = new Map(state.imageFiles);
          imageFiles.set(filename, file);
          return { imageFiles };
        }),
      addImageFiles: (files) =>
        set((state) => {
          const imageFiles = new Map(state.imageFiles);
          for (const file of files) {
            imageFiles.set(file.name, file);
          }
          return { imageFiles };
        }),
      removeImageFile: (filename) =>
        set((state) => {
          const imageFiles = new Map(state.imageFiles);
          imageFiles.delete(filename);
          return { imageFiles };
        }),
      setSubmissionProgress: (progress) =>
        set({ submissionProgress: progress }),
      setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
      reset: () =>
        set({
          adAccounts: [],
          selectedAdAccountId: "",
          pages: [],
          selectedPageId: "",
          selectedPageAccessToken: "",
          existingCampaigns: [],
          selectedExistingCampaignId: "",
          campaigns: [],
          imageFiles: new Map<string, File>(),
          submissionProgress: null,
          isSubmitting: false,
        }),
    }),
    {
      name: "meta-bulk-ads-store",
      partialize: (state) => ({
        selectedAdAccountId: state.selectedAdAccountId,
        selectedPageId: state.selectedPageId,
        selectedExistingCampaignId: state.selectedExistingCampaignId,
        adAccounts: state.adAccounts,
        pages: state.pages,
        existingCampaigns: state.existingCampaigns,
        campaigns: state.campaigns,
      }),
    }
  )
);
