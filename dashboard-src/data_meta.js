window.DATA = {
  meta: {
    compiled: 'October 26, 2026',
    compiledISO: '2026-10-26',
    window: 'Nov 2025 to Oct 2026, with the last 90 days (late July 2026 onward) flagged. Older sources are included only when foundational and are labeled.',
    accessSummary: '<p><b>This dashboard was built from web search results only.</b> The research environment could not open any web page directly, and two major sources were closed off entirely. Read the limitations before treating any item as settled.</p>' +
      '<ul>' +
      '<li><b>Reddit was not accessible.</b> The search provider is not permitted to index reddit.com and page fetching was blocked. Reddit evidence here comes only from two 2026 academic studies of subreddits, a few third-party mirror listings and articles that quote Reddit. No recent Reddit post text was recovered.</li>' +
      '<li><b>TikTok, Instagram and YouTube comment sections were not accessible.</b> Search returned TikTok captions and topic pages, YouTube video titles and Instagram profile pages. No comment threads were read.</li>' +
      '<li><b>No quote was phrase-verified.</b> The session hit its web search limit (200 searches) before the planned exact-phrase checks could run. Every quote is labeled by how its wording was captured: a verbatim page title or caption (most reliable), a search-engine excerpt (wording not confirmed), or a quote reported by an article.</li>' +
      '<li><b>No engagement numbers are presented as fact.</b> Views, likes and follower counts appear only where a dated publication reported them, and are labeled. High reach is never treated as approval.</li>' +
      '<li><b>Frequency is not prevalence.</b> How often something appears in this dataset reflects what search could surface. It does not tell you how common an experience is among women.</li>' +
      '</ul>'
  },
  segments: [
    {id:'adhd', name:'Women with diagnosed ADHD', short:'Diagnosed ADHD'},
    {id:'suspected', name:'Women with suspected ADHD or executive function challenges', short:'Suspected ADHD / EF'},
    {id:'moms', name:'Mothers (ADHD not assumed)', short:'Mothers'},
    {id:'millennial', name:'Millennial women, about 30 to 45 (general)', short:'Millennial women'}
  ],
  topics: [
    {id:'ef', name:'Executive function and time'},
    {id:'emotion', name:'Emotions, shame and rejection'},
    {id:'load', name:'Mental load and household'},
    {id:'partner', name:'Partners and marriage'},
    {id:'work', name:'Work, money and childcare'},
    {id:'body', name:'Hormones and health'},
    {id:'dx', name:'Diagnosis, medication and care'},
    {id:'identity', name:'Identity and self-worth'},
    {id:'parenting', name:'Parenting and school'},
    {id:'social', name:'Friendship, loneliness and community'},
    {id:'tools', name:'Tools, systems and AI'},
    {id:'media', name:'Social media and content'}
  ],
  pillars: [
    {n:1, name:'The things nobody explained about ADHD', desc:'Education on ADHD, executive function, task initiation, emotional regulation and related experiences.'},
    {n:2, name:'Things I’ve had to unlearn', desc:'Personal perspective on productivity, responsibility, boundaries, burnout, motherhood, relationships, identity and expectations.'},
    {n:3, name:'Practical ways to function better', desc:'Real-world strategies, systems, routines, tools, AI and Notion.'},
    {n:4, name:'ADHD and the bigger picture of being a woman', desc:'Where ADHD meets motherhood, relationships, work, expectations, identity and modern adulthood.'}
  ],
  ratingCriteria: [
    {name:'Evidence (Strong, Moderate, Emerging)', desc:'Strong means published research or official data plus firsthand voices point the same way. Moderate means several independent firsthand or journalistic sources agree. Emerging means a small number of sources, or sources that disagree.'},
    {name:'Resonance (High, Medium, Low)', desc:'A judgment of how emotionally charged and recurring the underlying experience is in the language of the sources. It is not a measure of reach or engagement.'},
    {name:'Differentiation (High, Medium, Low)', desc:'A judgment of how rarely the angle appears among the creators and content reviewed. High means it was not visible among surfaced creators. This is limited by what search could reach.'},
    {name:'Brand fit', desc:'A short note on how the opportunity connects to your four pillars and your existing positioning ("the problem isn’t you, the system is broken"). Judgment only.'},
    {name:'Important', desc:'None of these ratings are scores. They are qualitative judgments made from the evidence in this dashboard, written down so you can disagree with them.'}
  ],
  segmentIntro: 'These are four overlapping groups, researched separately. Do not assume every woman in this audience has ADHD or is a mother. The overlap matrix below shows where needs converge and where they diverge.',
  segmentRelations: [
    'Millennial women aged about 30 to 45 are the outer frame. Within that frame, two groups overlap: women with diagnosed or suspected ADHD (or executive function struggles without a label), and mothers.',
    'The overlap, mothers with ADHD, is where the evidence is densest and most emotionally charged: coping systems that worked before children stop working, and women repeatedly ask whether their struggle is motherhood or ADHD.',
    'Many women in this audience sit outside both circles: childfree or not-yet mothers, and women without executive function struggles who still relate to burnout, the flexibility penalty and rejecting hustle culture. Content that only speaks to the overlap leaves them out.'
  ],
  painIntro: 'Each pain point is a recurring problem documented across the sources, with quotes and links. "Sources in dataset" counts distinct supporting sources collected here. It shows the depth of evidence found, not how common the problem is. "Emotional intensity" is a labeled judgment based on the language in the sources.',
  sickIntro: 'Rejected advice, expectations women call unrealistic, content they criticize and solutions that disappointed them. Rejection here usually means "adapt it" rather than "abandon it", and several items are contested. Those disagreements are flagged.',
  wantIntro: 'What women are asking for, recommending to each other, working around, and still not getting. Unmet needs that rest on thin evidence are marked as under-researched.',
  listenIntro: 'Statements in women’s own words, with platform, date, theme and link. Tone is a qualitative reading, not a sentiment score. Where TikTok gave no date, an approximate date derived from the video ID is shown and labeled. Most items have no confirmed age, so they cannot be confirmed as millennial.',
  disruptIntro: 'Each opportunity sets out the conventional belief, what the audience is actually experiencing, why the belief is incomplete, the evidence, the alternative worth exploring and why it matters to your audience. None of these are provocation for its own sake. Each is tied to sources you can check.',
  libraryIntro: 'Every source behind the dashboard, with links, dates, source type and evidence quality. Evidence quality: High means peer-reviewed research, large registry or official data. Moderate means credible journalism, smaller studies, or verbatim firsthand titles and captions. Low means commercial content, self-selected surveys, secondhand reports, mirrors or single excerpts.',
  logIntro: 'This dashboard is meant to keep working after today. Save findings you want to act on, and log new observations from your own comment sections, DMs and reading. Everything here stays in this browser until you export it.',
  routine: [
    'Weekly: save five comments or DMs from your own content that describe a struggle in the person’s own words. Your audience’s language beats any secondary research.',
    'Weekly: note which of your posts drew saves or long comments versus quick agreement. Thoughtful discussion is the signal; a heart-eyes emoji is not.',
    'Monthly: re-check the "Under-researched" items in this dashboard. Several (ADHD mothers raising ADHD kids, women of color with ADHD, non-mothers in their 30s and 40s) need firsthand listening that search could not provide.',
    'Monthly: verify any statistic before you publish it. This dashboard marks every figure that still needs checking against its original source.',
    'Quarterly: ask your audience directly. A short survey or poll on one pain point will tell you more about prevalence among your people than anything here.'
  ],
  limitations: {
    platforms: [
      {platform:'Reddit (r/adhdwomen, r/TwoXADHD, r/workingmoms, r/Mommit, r/AskWomenOver30, r/ADHDparenting and others)', status:'Blocked', could:'Two 2026 academic analyses of subreddits; a few third-party mirror listings described by the search engine; older journalism quoting Reddit threads; community size snapshots from directories.', couldnt:'Any recent post or comment text. r/AskWomenOver30 produced nothing at all. r/workingmoms and r/ADHDparenting produced only metadata.'},
      {platform:'TikTok', status:'Partial', could:'Video captions (as result titles) and TikTok "discover" topic pages, which show what people search for.', couldnt:'Comment sections, view counts and engagement. Most captions show no date; approximate dates were derived from video IDs.'},
      {platform:'Instagram', status:'Minimal', could:'A handful of profile pages for ADHD and ADHD-mom accounts.', couldnt:'Reels, captions, comments or follower counts.'},
      {platform:'YouTube', status:'Partial', could:'Video titles.', couldnt:'Comments, view counts and descriptions (except fragments in search summaries).'},
      {platform:'Substack', status:'Good', could:'Post titles from hundreds of newsletters, some recent dates, and short excerpts.', couldnt:'Full posts, paywalled content and reader comment threads.'},
      {platform:'Mumsnet', status:'Partial', could:'Thread titles and short summaries of replies.', couldnt:'Full threads. Mumsnet skews UK.'},
      {platform:'What to Expect, BabyCenter', status:'Blocked', could:'Nothing.', couldnt:'The search provider could not access these sites.'},
      {platform:'Major outlets (NYT, The Atlantic, The Cut, The Guardian, BBC, Washington Post, Glamour)', status:'Blocked or not surfaced', could:'Occasional syndicated versions (for example a NYT piece republished in Australia).', couldnt:'Direct access. Several returned "not accessible" errors.'},
      {platform:'Research databases (PubMed, PMC, journals, government data)', status:'Good', could:'Study titles, abstracts and figures as summarized by search.', couldnt:'Full papers. Sample sizes and methods are shown only where the summary included them.'}
    ],
    method: [
      'Eight research tracks ran in parallel on October 26, 2026: ADHD women’s voices, mothers’ voices, millennial women and culture, published research, rejected advice, existing solutions, the creator landscape, and Reddit through indirect routes.',
      'All evidence came from web search results: page titles, URLs and search-engine summaries. No page was opened in full.',
      'Each quote carries a label for how its wording was captured. Verbatim titles and captions are the most reliable. Search excerpts may be slightly altered by the search engine’s summary. Excerpts that could not be tied to one specific page are labeled as such or left out.',
      'Statistics that circulate online but could not be traced to a primary source were excluded and are listed under Known gaps.',
      'Research and data were graded High, Moderate or Low. Firsthand statements were treated as evidence of what women say, not of how many women say it.',
      'Interpretations, opportunity ratings and recommendations are marked as strategic hypotheses.'
    ],
    gaps: [
      'No exact-phrase verification was possible. Send a follow-up message to run a verification pass on the top quotes and figures.',
      'Untraceable figures that were deliberately excluded: "86% of women grieve after diagnosis", "28% vs 15% divorce", "average diagnosis age 37 for women vs 7 for men", "54% vs 30% severe perimenopause symptoms", "84% of ADHD TikTok is misleading", "845,000 women left the workforce", "£1,600 a year ADHD cost", and a "6.8 million US women" figure derived by arithmetic rather than published by CDC.',
      'Not researched because the search limit was reached: overdiagnosis papers and the 2025 MAHA report on stimulants; the US Surgeon General’s parental stress advisory in its own words; American Time Use Survey data on mothers; screen-time absolutism; "lean in" and "having it all"; time blocking and inbox zero; employers; subscription fatigue as a direct topic; diet and supplement cure claims; dad creators and mom comedy creators; ADHD money creators; AI and Notion creators.',
      'Underserved segments flagged but not confirmed: mothers with ADHD raising children with ADHD, single and low-income mothers, Black and Latina women with ADHD, non-mothers in their 30s and 40s. Absence of evidence here is a search limit, not proof of a gap.',
      'Ages were almost never confirmed. Firsthand voices are assumed to be in or near the 30 to 45 range based on life stage, not verified.',
      'Mumsnet and several TikTok creators are British or Australian. US-specific experiences (insurance, school systems, childcare costs) may differ.',
      'Commercial content (apps, planners, hormone clinics, chore apps) was common in results. It is labeled Commercial and treated as low-quality evidence.',
      'Engagement data was almost entirely unavailable, so "high-performing topics" rests on research about reach, not on platform metrics.'
    ]
  }
};
