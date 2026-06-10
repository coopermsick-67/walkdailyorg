"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, Loader2 } from "lucide-react";

type CrossRef = {
  reference: string;
  text: string;
};

// Simplified cross-references map for common verses
// In production this would come from an API or a comprehensive JSON file
const CROSS_REFS_MAP: Record<string, CrossRef[]> = {
  "JHN.3.16": [
    { reference: "Romans 5:8", text: "But God demonstrates his own love for us in this: While we were still sinners, Christ died for us." },
    { reference: "1 John 4:9", text: "This is how God showed his love among us: He sent his one and only Son into the world that we might live through him." },
    { reference: "Romans 8:32", text: "He who did not spare his own Son, but gave him up for us all--how will he not also, along with him, graciously give us all things?" },
    { reference: "John 1:12", text: "Yet to all who did receive him, to those who believed in his name, he gave the right to become children of God." },
  ],
  "PSA.23.1": [
    { reference: "Ezekiel 34:14", text: "I will tend them in a good pasture, and the mountain heights of Israel will be their grazing land." },
    { reference: "John 10:11", text: "I am the good shepherd. The good shepherd lays down his life for the sheep." },
    { reference: "Isaiah 40:11", text: "He tends his flock like a shepherd: He gathers the lambs in his arms and carries them close to his heart." },
    { reference: "Revelation 7:17", text: "For the Lamb at the center of the throne will be their shepherd; he will lead them to springs of living water." },
  ],
  "PRO.3.5": [
    { reference: "Jeremiah 17:7", text: "But blessed is the one who trusts in the LORD, whose confidence is in him." },
    { reference: "Psalm 118:8", text: "It is better to take refuge in the LORD than to trust in humans." },
    { reference: "Isaiah 26:3-4", text: "You will keep in perfect peace those whose minds are steadfast, because they trust in you. Trust in the LORD forever, for the LORD, the LORD himself, is the Rock eternal." },
  ],
  "ROM.8.28": [
    { reference: "Genesis 50:20", text: "You intended to harm me, but God intended it for good to accomplish what is now being done, the saving of many lives." },
    { reference: "Philippians 1:12", text: "Now I want you to know, brothers and sisters, that what has happened to me has actually served to advance the gospel." },
    { reference: "Romans 5:3-4", text: "Not only so, but we also glory in our sufferings, because we know that suffering produces perseverance; perseverance, character; and character, hope." },
  ],
  "PHP.4.13": [
    { reference: "2 Corinthians 12:10", text: "That is why, for Christ's delight, I delight in weaknesses, in insults, in hardships, in persecutions, in difficulties." },
    { reference: "Colossians 1:24", text: "Now I rejoice in what I am suffering for you, and I fill up in my flesh what is still lacking in regard to Christ's afflictions." },
    { reference: "1 Peter 4:13", text: "But rejoice inasmuch as you participate in the sufferings of Christ, so that you may be overjoyed when his glory is revealed." },
  ],
  "JOS.1.9": [
    { reference: "Deuteronomy 31:6", text: "Be strong and courageous. Do not be afraid or terrified because of them, for the LORD your God goes with you; he will never leave you nor forsake you." },
    { reference: "Isaiah 41:10", text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand." },
    { reference: "Matthew 28:20", text: "And surely I am with you always, to the very end of the age." },
  ],
  "IS.40.31": [
    { reference: "Psalm 121:7-8", text: "The LORD will keep you from all harm-- he will watch over your life; the LORD will watch over your coming and going both now and forevermore." },
    { reference: "2 Thessalonians 3:3", text: "But the Lord is faithful, and he will strengthen you and protect you from the evil one." },
    { reference: "Psalm 55:22", text: "Cast your cares on the LORD and he will sustain you; he will never let the righteous be shaken." },
  ],
  "HEB.11.1": [
    { reference: "2 Corinthians 5:7", text: "For we live by faith, not by sight." },
    { reference: "Romans 1:17", text: "For in the gospel the righteousness of God is revealed--a righteousness that is by faith from first to last." },
    { reference: "1 Peter 1:7", text: "These trials have come so that the proven genuineness of your faith--of greater worth than gold, which perishes even though refined by fire--may result in praise, glory and honor when Jesus Christ is revealed." },
  ],
  "MAT.11.28": [
    { reference: "John 10:28", text: "I give them eternal life, and they shall never perish; no one will snatch them out of my hand." },
    { reference: "Romans 6:23", text: "For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord." },
    { reference: "Psalm 34:18", text: "The LORD is close to the brokenhearted and saves those who are crushed in spirit." },
  ],
  "GRACE.6.9": [
    { reference: "2 Corinthians 12:9", text: "My grace is sufficient for you, for my power is made perfect in weakness." },
    { reference: "Ephesians 2:8", text: "For it is by grace you have been saved, through faith--and this is not from yourselves, it is the gift of God." },
  ],
};

function getCrossReferences(reference: string): CrossRef[] {
  // Try exact match
  if (CROSS_REFS_MAP[reference]) return CROSS_REFS_MAP[reference];

  // Try to find partial matches (e.g. "GEN.1.1" -> check common devotional verses)
  for (const refs of Object.values(CROSS_REFS_MAP)) {
    for (const ref of refs) {
      if (reference.includes(ref.reference.split(" ")[0])) {
        return refs;
      }
    }
  }

  return [];
}

export default function CrossReferences({
  reference,
  isOpen,
  onClose,
  onVerseTap,
}: {
  reference: string;
  isOpen: boolean;
  onClose: () => void;
  onVerseTap: (verse: CrossRef) => void;
}) {
  const [refs, setRefs] = useState<CrossRef[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && reference) {
      setIsLoading(true);
      // Simulate async loading for verses not in the static map
      const timer = setTimeout(() => {
        const results = getCrossReferences(reference);
        setRefs(results);
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, reference]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-up drawer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] rounded-t-3xl flex flex-col safe-bottom"
        style={{
          background: "var(--surface-card)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Handle + header */}
        <div className="flex-shrink-0 p-4 pb-2">
          <div className="flex justify-center mb-3">
            <div
              className="w-10 h-1 rounded-full"
              style={{ background: "var(--border-strong)" }}
            />
          </div>
          <div className="flex items-center justify-between">
            <h3
              className="text-base font-semibold font-heading"
              style={{ color: "var(--text-primary)" }}
            >
              Cross References
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg"
              style={{ color: "var(--text-muted)" }}
              aria-label="Close cross references"
            >
              <X size={18} />
            </button>
          </div>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--color-primary-500)" }}
          >
            {reference}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {isLoading ? (
            <div
              className="flex items-center justify-center gap-2 py-8 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              <Loader2 size={16} className="animate-spin" />
              Finding related verses...
            </div>
          ) : refs.length === 0 ? (
            <div
              className="text-center py-8 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              No cross references found for this verse.
              <br />
              Try a well-known verse like John 3:16 or Psalm 23:1.
            </div>
          ) : (
            <div className="space-y-3">
              {refs.map((ref, i) => (
                <button
                  key={`${ref.reference}-${i}`}
                  className="w-full text-left p-3 rounded-xl transition-colors"
                  style={{
                    background: "var(--surface-elevated)",
                    border: "1px solid var(--border)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--color-primary-50)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--surface-elevated)";
                  }}
                  onClick={() => onVerseTap(ref)}
                >
                  <div className="flex items-start gap-2">
                    <ChevronRight
                      size={14}
                      className="mt-0.5 flex-shrink-0"
                      style={{ color: "var(--color-accent-500)" }}
                    />
                    <div>
                      <p
                        className="text-xs font-semibold mb-1"
                        style={{ color: "var(--color-primary-500)" }}
                      >
                        {ref.reference}
                      </p>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {ref.text}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
