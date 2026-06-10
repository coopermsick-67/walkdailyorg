"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, Loader2 } from "lucide-react";

type CrossRef = {
  reference: string;
  text: string;
};

// Comprehensive cross-references map covering all major passages
// Keys use the bible-api id format (e.g. "JHN.3.16") and human-readable (e.g. "John 3:16")
const CROSS_REFS_MAP: Record<string, CrossRef[]> = {
  // John 3:16
  "JHN.3.16": [
    { reference: "Romans 5:8", text: "But God demonstrates his own love for us in this: While we were still sinners, Christ died for us." },
    { reference: "1 John 4:9", text: "This is how God showed his love among us: He sent his one and only Son into the world that we might live through him." },
    { reference: "Romans 8:32", text: "He who did not spare his own Son, but gave him up for us all—how will he not also, along with him, graciously give us all things?" },
    { reference: "John 1:12", text: "Yet to all who did receive him, to those who believed in his name, he gave the right to become children of God." },
    { reference: "Ephesians 2:4-5", text: "But because of his great love for us, God, who is rich in mercy, made us alive with Christ even when we were dead in transgressions." },
  ],
  "John 3:16": [
    { reference: "Romans 5:8", text: "But God demonstrates his own love for us in this: While we were still sinners, Christ died for us." },
    { reference: "1 John 4:9", text: "This is how God showed his love among us: He sent his one and only Son into the world that we might live through him." },
    { reference: "Romans 8:32", text: "He who did not spare his own Son, but gave him up for us all—how will he not also, along with him, graciously give us all things?" },
    { reference: "John 1:12", text: "Yet to all who did receive him, to those who believed in his name, he gave the right to become children of God." },
    { reference: "Ephesians 2:4-5", text: "But because of his great love for us, God, who is rich in mercy, made us alive with Christ even when we were dead in transgressions." },
  ],

  // Psalm 23:1
  "PSA.23.1": [
    { reference: "Ezekiel 34:14", text: "I will tend them in a good pasture, and the mountain heights of Israel will be their grazing land." },
    { reference: "John 10:11", text: "I am the good shepherd. The good shepherd lays down his life for the sheep." },
    { reference: "Isaiah 40:11", text: "He tends his flock like a shepherd: He gathers the lambs in his arms and carries them close to his heart." },
    { reference: "Revelation 7:17", text: "For the Lamb at the center of the throne will be their shepherd; he will lead them to springs of living water." },
    { reference: "Psalm 23:4", text: "Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me." },
  ],
  "Psalm 23:1": [
    { reference: "Ezekiel 34:14", text: "I will tend them in a good pasture, and the mountain heights of Israel will be their grazing land." },
    { reference: "John 10:11", text: "I am the good shepherd. The good shepherd lays down his life for the sheep." },
    { reference: "Isaiah 40:11", text: "He tends his flock like a shepherd: He gathers the lambs in his arms and carries them close to his heart." },
    { reference: "Revelation 7:17", text: "For the Lamb at the center of the throne will be their shepherd; he will lead them to springs of living water." },
  ],

  // Proverbs 3:5
  "PRO.3.5": [
    { reference: "Jeremiah 17:7", text: "But blessed is the one who trusts in the LORD, whose confidence is in him." },
    { reference: "Psalm 118:8", text: "It is better to take refuge in the LORD than to trust in humans." },
    { reference: "Isaiah 26:3-4", text: "You will keep in perfect peace those whose minds are steadfast, because they trust in you. Trust in the LORD forever, for the LORD, the LORD himself, is the Rock eternal." },
    { reference: "Proverbs 3:6", text: "In all your ways submit to him, and he will make your paths straight." },
    { reference: "Psalm 37:5", text: "Commit your way to the LORD; trust in him and he will do this." },
  ],
  "Proverbs 3:5": [
    { reference: "Jeremiah 17:7", text: "But blessed is the one who trusts in the LORD, whose confidence is in him." },
    { reference: "Psalm 118:8", text: "It is better to take refuge in the LORD than to trust in humans." },
    { reference: "Isaiah 26:3-4", text: "You will keep in perfect peace those whose minds are steadfast, because they trust in you. Trust in the LORD forever, for the LORD, the LORD himself, is the Rock eternal." },
  ],

  // Romans 8:28
  "ROM.8.28": [
    { reference: "Genesis 50:20", text: "You intended to harm me, but God intended it for good to accomplish what is now being done, the saving of many lives." },
    { reference: "Philippians 1:12", text: "Now I want you to know, brothers and sisters, that what has happened to me has actually served to advance the gospel." },
    { reference: "Romans 5:3-4", text: "Not only so, but we also glory in our sufferings, because we know that suffering produces perseverance; perseverance, character; and character, hope." },
    { reference: "James 1:2-4", text: "Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance." },
    { reference: "2 Corinthians 4:17", text: "For our light and momentary troubles are achieving for us an eternal glory that far outweighs them all." },
  ],
  "Romans 8:28": [
    { reference: "Genesis 50:20", text: "You intended to harm me, but God intended it for good to accomplish what is now being done, the saving of many lives." },
    { reference: "Philippians 1:12", text: "Now I want you to know, brothers and sisters, that what has happened to me has actually served to advance the gospel." },
    { reference: "Romans 5:3-4", text: "Not only so, but we also glory in our sufferings, because we know that suffering produces perseverance; perseverance, character; and character, hope." },
  ],

  // Philippians 4:13
  "PHP.4.13": [
    { reference: "2 Corinthians 12:10", text: "That is why, for Christ's delight, I delight in weaknesses, in insults, in hardships, in persecutions, in difficulties." },
    { reference: "Colossians 1:24", text: "Now I rejoice in what I am suffering for you, and I fill up in my flesh what is still lacking in regard to Christ's afflictions." },
    { reference: "1 Peter 4:13", text: "But rejoice inasmuch as you participate in the sufferings of Christ, so that you may be overjoyed when his glory is revealed." },
    { reference: "Isaiah 40:31", text: "But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint." },
    { reference: "2 Corinthians 12:9", text: "My grace is sufficient for you, for my power is made perfect in weakness." },
  ],
  "Philippians 4:13": [
    { reference: "2 Corinthians 12:10", text: "That is why, for Christ's delight, I delight in weaknesses, in insults, in hardships, in persecutions, in difficulties." },
    { reference: "Colossians 1:24", text: "Now I rejoice in what I am suffering for you, and I fill up in my flesh what is still lacking in regard to Christ's afflictions." },
    { reference: "1 Peter 4:13", text: "But rejoice inasmuch as you participate in the sufferings of Christ, so that you may be overjoyed when his glory is revealed." },
  ],

  // Joshua 1:9
  "JOS.1.9": [
    { reference: "Deuteronomy 31:6", text: "Be strong and courageous. Do not be afraid or terrified because of them, for the LORD your God goes with you; he will never leave you nor forsake you." },
    { reference: "Isaiah 41:10", text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand." },
    { reference: "Matthew 28:20", text: "And surely I am with you always, to the very end of the age." },
    { reference: "Hebrews 13:5", text: "Never will I leave you; never will I forsake you." },
    { reference: "Psalm 27:1", text: "The LORD is my light and my salvation—whom shall I fear? The LORD is the stronghold of my life—of whom shall I be afraid?" },
  ],
  "Joshua 1:9": [
    { reference: "Deuteronomy 31:6", text: "Be strong and courageous. Do not be afraid or terrified because of them, for the LORD your God goes with you; he will never leave you nor forsake you." },
    { reference: "Isaiah 41:10", text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand." },
    { reference: "Matthew 28:20", text: "And surely I am with you always, to the very end of the age." },
  ],

  // Isaiah 40:31
  "ISA.40.31": [
    { reference: "Psalm 121:7-8", text: "The LORD will keep you from all harm—he will watch over your life; the LORD will watch over your coming and going both now and forevermore." },
    { reference: "2 Thessalonians 3:3", text: "But the Lord is faithful, and he will strengthen you and protect you from the evil one." },
    { reference: "Psalm 55:22", text: "Cast your cares on the LORD and he will sustain you; he will never let the righteous be shaken." },
    { reference: "Philippians 4:13", text: "I can do all this through him who gives me strength." },
    { reference: "2 Corinthians 12:9", text: "My grace is sufficient for you, for my power is made perfect in weakness." },
  ],
  "Isaiah 40:31": [
    { reference: "Psalm 121:7-8", text: "The LORD will keep you from all harm—he will watch over your life; the LORD will watch over your coming and going both now and forevermore." },
    { reference: "2 Thessalonians 3:3", text: "But the Lord is faithful, and he will strengthen you and protect you from the evil one." },
    { reference: "Psalm 55:22", text: "Cast your cares on the LORD and he will sustain you; he will never let the righteous be shaken." },
  ],

  // Hebrews 11:1
  "HEB.11.1": [
    { reference: "2 Corinthians 5:7", text: "For we live by faith, not by sight." },
    { reference: "Romans 1:17", text: "For in the gospel the righteousness of God is revealed—a righteousness that is by faith from first to last." },
    { reference: "1 Peter 1:7", text: "These trials have come so that the proven genuineness of your faith—of greater worth than gold, which perishes even though refined by fire—may result in praise, glory and honor when Jesus Christ is revealed." },
    { reference: "Galatians 2:20", text: "I have been crucified with Christ and I no longer live, but Christ lives in me. The life I now live in the body, I live by faith in the Son of God, who loved me and gave himself for me." },
    { reference: "James 2:26", text: "As the body without the spirit is dead, so faith without deeds is dead." },
  ],
  "Hebrews 11:1": [
    { reference: "2 Corinthians 5:7", text: "For we live by faith, not by sight." },
    { reference: "Romans 1:17", text: "For in the gospel the righteousness of God is revealed—a righteousness that is by faith from first to last." },
    { reference: "1 Peter 1:7", text: "These trials have come so that the proven genuineness of your faith—of greater worth than gold, which perishes even though refined by fire—may result in praise, glory and honor when Jesus Christ is revealed." },
  ],

  // Matthew 11:28
  "MAT.11.28": [
    { reference: "John 10:28", text: "I give them eternal life, and they shall never perish; no one will snatch them out of my hand." },
    { reference: "Romans 6:23", text: "For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord." },
    { reference: "Psalm 34:18", text: "The LORD is close to the brokenhearted and saves those who are crushed in spirit." },
    { reference: "Isaiah 41:10", text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you." },
    { reference: "Psalm 55:22", text: "Cast your cares on the LORD and he will sustain you; he will never let the righteous be shaken." },
  ],
  "Matthew 11:28": [
    { reference: "John 10:28", text: "I give them eternal life, and they shall never perish; no one will snatch them out of my hand." },
    { reference: "Romans 6:23", text: "For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord." },
    { reference: "Psalm 34:18", text: "The LORD is close to the brokenhearted and saves those who are crushed in spirit." },
  ],

  // Galatians 6:9
  "GAL.6.9": [
    { reference: "2 Corinthians 12:9", text: "My grace is sufficient for you, for my power is made perfect in weakness." },
    { reference: "Ephesians 2:8", text: "For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God." },
    { reference: "Hebrews 10:36", text: "You need to persevere so that when you have done the will of God, you will receive what he has promised." },
    { reference: "James 1:12", text: "Blessed is the one who perseveres under trial because, having stood the test, that person will receive the crown of life that the Lord has promised to those who love him." },
    { reference: "Romans 5:3-4", text: "Not only so, but we also glory in our sufferings, because we know that suffering produces perseverance; perseverance, character; and character, hope." },
  ],
  "Galatians 6:9": [
    { reference: "2 Corinthians 12:9", text: "My grace is sufficient for you, for my power is made perfect in weakness." },
    { reference: "Ephesians 2:8", text: "For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God." },
    { reference: "Hebrews 10:36", text: "You need to persevere so that when you have done the will of God, you will receive what he has promised." },
  ],

  // Jeremiah 29:11
  "JER.29.11": [
    { reference: "Romans 8:28", text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose." },
    { reference: "Proverbs 16:9", text: "In their hearts humans plan their course, but the LORD establishes their steps." },
    { reference: "Isaiah 55:8-9", text: '"For my thoughts are not your thoughts, neither are your ways my ways," declares the LORD.' },
    { reference: "Psalm 37:23", text: "The LORD directs the steps of the godly. He delights in every detail of their lives." },
    { reference: "Romans 8:31", text: "If God is for us, who can be against us?" },
  ],
  "Jeremiah 29:11": [
    { reference: "Romans 8:28", text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose." },
    { reference: "Proverbs 16:9", text: "In their hearts humans plan their course, but the LORD establishes their steps." },
    { reference: "Isaiah 55:8-9", text: '"For my thoughts are not your thoughts, neither are your ways my ways," declares the LORD.' },
  ],

  // Romans 12:2
  "ROM.12.2": [
    { reference: "Philippians 3:20", text: "But our citizenship is in heaven. And we eagerly await a Savior from there, the Lord Jesus Christ." },
    { reference: "Colossians 3:2", text: "Set your minds on things above, not on earthly things." },
    { reference: "Galatians 2:20", text: "I have been crucified with Christ and I no longer live, but Christ lives in me." },
    { reference: "Ephesians 4:23-24", text: "To be made new in the attitude of your minds; and to put on the new self, created to be like God in true righteousness and holiness." },
    { reference: "James 1:22", text: "Do not merely listen to the word, and so deceive yourselves. Do what it says." },
  ],
  "Romans 12:2": [
    { reference: "Philippians 3:20", text: "But our citizenship is in heaven. And we eagerly await a Savior from there, the Lord Jesus Christ." },
    { reference: "Colossians 3:2", text: "Set your minds on things above, not on earthly things." },
    { reference: "Ephesians 4:23-24", text: "To be made new in the attitude of your minds; and to put on the new self, created to be like God in true righteousness and holiness." },
  ],

  // Ephesians 2:8
  "EPH.2.8": [
    { reference: "Romans 3:24", text: "And all are justified freely by his grace through the redemption that came by Christ Jesus." },
    { reference: "Titus 3:5", text: "He saved us, not because of righteous things we had done, but because of his mercy." },
    { reference: "Galatians 2:16", text: "Know that a person is not justified by the works of the law, but by faith in Jesus Christ." },
    { reference: "Romans 5:1", text: "Therefore, since we have been justified through faith, we have peace with God through our Lord Jesus Christ." },
    { reference: "2 Timothy 1:9", text: "He has saved us and called us to a holy life—not because of anything we have done but because of his own purpose and grace." },
  ],
  "Ephesians 2:8": [
    { reference: "Romans 3:24", text: "And all are justified freely by his grace through the redemption that came by Christ Jesus." },
    { reference: "Titus 3:5", text: "He saved us, not because of righteous things we had done, but because of his mercy." },
    { reference: "Galatians 2:16", text: "Know that a person is not justified by the works of the law, but by faith in Jesus Christ." },
  ],

  // Genesis 1:1
  "GEN.1.1": [
    { reference: "John 1:1", text: "In the beginning was the Word, and the Word was with God, and the Word was God." },
    { reference: "Psalm 33:6", text: "By the word of the LORD the heavens were made, their starry host by the breath of his mouth." },
    { reference: "Hebrews 11:3", text: "By faith we understand that the universe was formed at God's command, so that what is seen was not made out of what was visible." },
    { reference: "Colossians 1:16", text: "For in him all things were created: things in heaven and on earth, visible and invisible." },
    { reference: "Isaiah 40:28", text: "Do you not know? Have you not heard? The LORD is the everlasting God, the Creator of the ends of the earth." },
  ],
  "Genesis 1:1": [
    { reference: "John 1:1", text: "In the beginning was the Word, and the Word was with God, and the Word was God." },
    { reference: "Psalm 33:6", text: "By the word of the LORD the heavens were made, their starry host by the breath of his mouth." },
    { reference: "Hebrews 11:3", text: "By faith we understand that the universe was formed at God's command, so that what is seen was not made out of what was visible." },
  ],

  // Psalm 27:1
  "PSA.27.1": [
    { reference: "Isaiah 41:10", text: "So do not fear, for I am with you; do not be dismayed, for I am your God." },
    { reference: "Romans 8:31", text: "If God is for us, who can be against us?" },
    { reference: "Joshua 1:9", text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go." },
    { reference: "Psalm 56:3", text: "When I am afraid, I put my trust in you." },
    { reference: "2 Timothy 1:7", text: "For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline." },
  ],
  "Psalm 27:1": [
    { reference: "Isaiah 41:10", text: "So do not fear, for I am with you; do not be dismayed, for I am your God." },
    { reference: "Romans 8:31", text: "If God is for us, who can be against us?" },
    { reference: "Joshua 1:9", text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go." },
  ],

  // 2 Timothy 1:7
  "2TI.1.7": [
    { reference: "Isaiah 41:10", text: "So do not fear, for I am with you; do not be dismayed, for I am your God." },
    { reference: "Philippians 4:6-7", text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God." },
    { reference: "1 John 4:18", text: "There is no fear in love. But perfect love drives out fear." },
    { reference: "Psalm 56:3", text: "When I am afraid, I put my trust in you." },
    { reference: "Romans 8:15", text: "The Spirit you received does not make you slaves, so that you live in fear again; rather, the Spirit you received brought about your adoption to sonship." },
  ],
  "2 Timothy 1:7": [
    { reference: "Isaiah 41:10", text: "So do not fear, for I am with you; do not be dismayed, for I am your God." },
    { reference: "Philippians 4:6-7", text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God." },
    { reference: "1 John 4:18", text: "There is no fear in love. But perfect love drives out fear." },
  ],

  // Philippians 4:6-7
  "PHP.4.6": [
    { reference: "1 Peter 5:7", text: "Cast all your anxiety on him because he cares for you." },
    { reference: "Matthew 6:34", text: "Therefore do not worry about tomorrow, for tomorrow will worry about itself." },
    { reference: "Psalm 55:22", text: "Cast your cares on the LORD and he will sustain you; he will never let the righteous be shaken." },
    { reference: "John 14:27", text: "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid." },
    { reference: "Isaiah 26:3", text: "You will keep in perfect peace those whose minds are steadfast, because they trust in you." },
  ],
  "Philippians 4:6-7": [
    { reference: "1 Peter 5:7", text: "Cast all your anxiety on him because he cares for you." },
    { reference: "Matthew 6:34", text: "Therefore do not worry about tomorrow, for tomorrow will worry about itself." },
    { reference: "Psalm 55:22", text: "Cast your cares on the LORD and he will sustain you; he will never let the righteous be shaken." },
  ],

  // Romans 8:1
  "ROM.8.1": [
    { reference: "Romans 5:1", text: "Therefore, since we have been justified through faith, we have peace with God through our Lord Jesus Christ." },
    { reference: "John 8:36", text: "So if the Son sets you free, you will be free indeed." },
    { reference: "2 Corinthians 5:17", text: "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!" },
    { reference: "Galatians 5:1", text: "It is for freedom that Christ has set us free. Stand firm, then, and do not let yourselves be burdened again by a yoke of slavery." },
    { reference: "1 John 1:9", text: "If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness." },
  ],
  "Romans 8:1": [
    { reference: "Romans 5:1", text: "Therefore, since we have been justified through faith, we have peace with God through our Lord Jesus Christ." },
    { reference: "John 8:36", text: "So if the Son sets you free, you will be free indeed." },
    { reference: "2 Corinthians 5:17", text: "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!" },
  ],

  // Psalm 46:10
  "PSA.46.10": [
    { reference: "Exodus 14:14", text: "The LORD will fight for you; you need only to be still." },
    { reference: "Psalm 27:14", text: "Wait for the LORD; be strong and take heart and wait for the LORD." },
    { reference: "Isaiah 40:31", text: "But those who hope in the LORD will renew their strength. They will soar on wings like eagles." },
    { reference: "Mark 4:39", text: "He got up, rebuked the wind and said to the waves, 'Quiet! Be still!' Then the wind died down and it was completely calm." },
    { reference: "Habakkuk 2:20", text: "The LORD is in his holy temple; let all the earth be silent before him." },
  ],
  "Psalm 46:10": [
    { reference: "Exodus 14:14", text: "The LORD will fight for you; you need only to be still." },
    { reference: "Psalm 27:14", text: "Wait for the LORD; be strong and take heart and wait for the LORD." },
    { reference: "Isaiah 40:31", text: "But those who hope in the LORD will renew their strength. They will soar on wings like eagles." },
  ],

  // Isaiah 41:10
  "ISA.41.10": [
    { reference: "Deuteronomy 31:6", text: "Be strong and courageous. Do not be afraid or terrified because of them, for the LORD your God goes with you." },
    { reference: "Psalm 23:4", text: "Even though I walk through the darkest valley, I will fear no evil, for you are with me." },
    { reference: "Matthew 28:20", text: "And surely I am with you always, to the very end of the age." },
    { reference: "Hebrews 13:5", text: "Never will I leave you; never will I forsake you." },
    { reference: "Romans 8:38-39", text: "For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord." },
  ],
  "Isaiah 41:10": [
    { reference: "Deuteronomy 31:6", text: "Be strong and courageous. Do not be afraid or terrified because of them, for the LORD your God goes with you." },
    { reference: "Psalm 23:4", text: "Even though I walk through the darkest valley, I will fear no evil, for you are with me." },
    { reference: "Matthew 28:20", text: "And surely I am with you always, to the very end of the age." },
  ],

  // 1 Corinthians 13:4-5
  "1CO.13.4": [
    { reference: "Galatians 5:22-23", text: "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control." },
    { reference: "Colossians 3:14", text: "And over all these virtues put on love, which binds them all together in perfect unity." },
    { reference: "1 Peter 4:8", text: "Above all, love each other deeply, because love covers over a multitude of sins." },
    { reference: "John 13:34", text: "A new command I give you: Love one another. As I have loved you, so you must love one another." },
    { reference: "Romans 13:10", text: "Love does no harm to a neighbor. Therefore love is the fulfillment of the law." },
  ],
  "1 Corinthians 13:4-5": [
    { reference: "Galatians 5:22-23", text: "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control." },
    { reference: "Colossians 3:14", text: "And over all these virtues put on love, which binds them all together in perfect unity." },
    { reference: "1 Peter 4:8", text: "Above all, love each other deeply, because love covers over a multitude of sins." },
  ],

  // James 1:2-4
  "JAS.1.2": [
    { reference: "Romans 5:3-4", text: "Not only so, but we also glory in our sufferings, because we know that suffering produces perseverance; perseverance, character; and character, hope." },
    { reference: "1 Peter 1:6-7", text: "In all this you greatly rejoice, though now for a little while you may have had to suffer grief in all kinds of trials." },
    { reference: "Hebrews 12:11", text: "No discipline seems pleasant at the time, but painful. Later on, however, it produces a harvest of righteousness and peace for those who have been trained by it." },
    { reference: "2 Corinthians 4:17", text: "For our light and momentary troubles are achieving for us an eternal glory that far outweighs them all." },
    { reference: "Romans 8:18", text: "I consider that our present sufferings are not worth comparing with the glory that will be revealed in us." },
  ],
  "James 1:2-4": [
    { reference: "Romans 5:3-4", text: "Not only so, but we also glory in our sufferings, because we know that suffering produces perseverance; perseverance, character; and character, hope." },
    { reference: "1 Peter 1:6-7", text: "In all this you greatly rejoice, though now for a little while you may have had to suffer grief in all kinds of trials." },
    { reference: "Hebrews 12:11", text: "No discipline seems pleasant at the time, but painful. Later on, however, it produces a harvest of righteousness and peace for those who have been trained by it." },
  ],

  // Psalm 119:105
  "PSA.119.105": [
    { reference: "2 Timothy 3:16", text: "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness." },
    { reference: "Hebrews 4:12", text: "For the word of God is alive and active. Sharper than any double-edged sword." },
    { reference: "Isaiah 55:11", text: "So is my word that goes out from my mouth: It will not return to me empty, but will accomplish what I desire." },
    { reference: "Joshua 1:8", text: "Keep this Book of the Law always on your lips; meditate on it day and night." },
    { reference: "Psalm 19:7", text: "The law of the LORD is perfect, refreshing the soul. The statutes of the LORD are trustworthy, making wise the simple." },
  ],
  "Psalm 119:105": [
    { reference: "2 Timothy 3:16", text: "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness." },
    { reference: "Hebrews 4:12", text: "For the word of God is alive and active. Sharper than any double-edged sword." },
    { reference: "Isaiah 55:11", text: "So is my word that goes out from my mouth: It will not return to me empty, but will accomplish what I desire." },
  ],

  // Matthew 6:33
  "MAT.6.33": [
    { reference: "Philippians 4:19", text: "And my God will meet all your needs according to the riches of his glory in Christ Jesus." },
    { reference: "Psalm 37:4", text: "Take delight in the LORD, and he will give you the desires of your heart." },
    { reference: "Luke 12:31", text: "But seek his kingdom, and these things will be given to you as well." },
    { reference: "Psalm 84:11", text: "For the LORD God is a sun and shield; the LORD bestows favor and honor; no good thing does he withhold from those whose walk is blameless." },
    { reference: "Romans 8:32", text: "He who did not spare his own Son, but gave him up for us all—how will he not also, along with him, graciously give us all things?" },
  ],
  "Matthew 6:33": [
    { reference: "Philippians 4:19", text: "And my God will meet all your needs according to the riches of his glory in Christ Jesus." },
    { reference: "Psalm 37:4", text: "Take delight in the LORD, and he will give you the desires of your heart." },
    { reference: "Luke 12:31", text: "But seek his kingdom, and these things will be given to you as well." },
  ],

  // 2 Corinthians 5:17
  "2CO.5.17": [
    { reference: "Galatians 2:20", text: "I have been crucified with Christ and I no longer live, but Christ lives in me." },
    { reference: "Ezekiel 36:26", text: "I will give you a new heart and put a new spirit in you; I will remove from you your heart of stone and give you a heart of flesh." },
    { reference: "Romans 6:6", text: "For we know that our old self was crucified with him so that the body ruled by sin might be done away with." },
    { reference: "Colossians 3:9-10", text: "Do not lie to each other, since you have taken off your old self with its practices and have put on the new self, which is being renewed in knowledge in the image of its Creator." },
    { reference: "John 3:3", text: "Jesus replied, 'Very truly I tell you, no one can see the kingdom of God unless they are born again.'" },
  ],
  "2 Corinthians 5:17": [
    { reference: "Galatians 2:20", text: "I have been crucified with Christ and I no longer live, but Christ lives in me." },
    { reference: "Ezekiel 36:26", text: "I will give you a new heart and put a new spirit in you; I will remove from you your heart of stone and give you a heart of flesh." },
    { reference: "Romans 6:6", text: "For we know that our old self was crucified with him so that the body ruled by sin might be done away with." },
  ],

  // Micah 6:8
  "MIC.6.8": [
    { reference: "Isaiah 1:17", text: "Learn to do right; seek justice. Defend the oppressed. Take up the cause of the fatherless; plead the case of the widow." },
    { reference: "Matthew 23:23", text: "Woe to you, teachers of the law and Pharisees, you hypocrites! You give a tenth of your spices—mint, dill and cumin. But you have neglected the more important matters of the law—justice, mercy and faithfulness." },
    { reference: "James 1:27", text: "Religion that God our Father accepts as pure and faultless is this: to look after orphans and widows in their distress." },
    { reference: "Proverbs 31:8-9", text: "Speak up for those who cannot speak for themselves, for the rights of all who are destitute. Speak up and judge fairly; defend the rights of the poor and needy." },
    { reference: "Luke 11:42", text: "Woe to you Pharisees, because you give God a tenth of your mint, rue and all other kinds of garden herbs, but you neglect justice and the love of God." },
  ],
  "Micah 6:8": [
    { reference: "Isaiah 1:17", text: "Learn to do right; seek justice. Defend the oppressed. Take up the cause of the fatherless; plead the case of the widow." },
    { reference: "Matthew 23:23", text: "Woe to you, teachers of the law and Pharisees, you hypocrites! You give a tenth of your spices—mint, dill and cumin. But you have neglected the more important matters of the law—justice, mercy and faithfulness." },
    { reference: "James 1:27", text: "Religion that God our Father accepts as pure and faultless is this: to look after orphans and widows in their distress." },
  ],
};

// Book name normalization: maps human-readable book names to their abbreviations
// used in the bible-api id format
const BOOK_ABBREV: Record<string, string> = {
  genesis: "GEN", exodus: "EXO", leviticus: "LEV", numbers: "NUM", deuteronomy: "DEU",
  joshua: "JOS", judges: "JDG", ruth: "RUT", "1 samuel": "1SA", "2 samuel": "2SA",
  "1 kings": "1KI", "2 kings": "2KI", "1 chronicles": "1CH", "2 chronicles": "2CH",
  ezra: "EZR", nehemiah: "NEH", esther: "EST", job: "JOB", psalms: "PSA", psalm: "PSA",
  proverbs: "PRO", ecclesiastes: "ECC", "song of solomon": "SNG", isaiah: "ISA",
  jeremiah: "JER", lamentations: "LAM", ezekiel: "EZK", daniel: "DAN", hosea: "HOS",
  joel: "JOL", amos: "AMO", obadiah: "OBA", jonah: "JON", micah: "MIC",
  nahum: "NAM", habakkuk: "HAB", zephaniah: "ZEP", haggai: "HAG", zechariah: "ZEC",
  malachi: "MAL", matthew: "MAT", mark: "MRK", luke: "LUK", john: "JHN",
  acts: "ACT", romans: "ROM", "1 corinthians": "1CO", "2 corinthians": "2CO",
  galatians: "GAL", ephesians: "EPH", philippians: "PHP", colossians: "COL",
  "1 thessalonians": "1TH", "2 thessalonians": "2TH", "1 timothy": "1TI",
  "2 timothy": "2TI", titus: "TIT", philemon: "PHM", hebrews: "HEB",
  james: "JAS", "1 peter": "1PE", "2 peter": "2PE", "1 john": "1JN",
  "2 john": "2JN", "3 john": "3JN", jude: "JUD", revelation: "REV",
};

function normalizeReference(reference: string): string[] {
  const results: string[] = [reference];

  // Try to parse "Book Chapter:Verse" format into bible-api id format
  const match = reference.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (match) {
    const bookName = match[1].toLowerCase().trim();
    const chapter = match[2];
    const verse = match[3];
    const abbrev = BOOK_ABBREV[bookName];
    if (abbrev) {
      results.push(`${abbrev}.${chapter}.${verse}`);
    }
  }

  return results;
}

function getCrossReferences(reference: string): CrossRef[] {
  // Try all normalized forms
  const keys = normalizeReference(reference);
  for (const key of keys) {
    if (CROSS_REFS_MAP[key]) return CROSS_REFS_MAP[key];
  }

  // Try partial match: check if any key in the map starts with the same book.chapter
  const chapterMatch = reference.match(/^(.+?)\s+(\d+):/);
  if (chapterMatch) {
    const bookChapter = `${chapterMatch[1].toLowerCase().trim()} ${chapterMatch[2]}`;
    for (const key of Object.keys(CROSS_REFS_MAP)) {
      if (key.toLowerCase().startsWith(bookChapter)) {
        return CROSS_REFS_MAP[key];
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
      const timer = setTimeout(() => {
        const results = getCrossReferences(reference);
        setRefs(results);
        setIsLoading(false);
      }, 300);
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
              Try a well-known passage like John 3:16, Psalm 23, or Romans 8:28.
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
