function computeLeadScore(engager) {
  let score = 0;

  // Connections (25%)
  const connections = engager.connections || 0;
  if (connections >= 5000) score += 25;
  else if (connections >= 2000) score += 20;
  else if (connections >= 500) score += 15;
  else if (connections >= 100) score += 8;
  else score += 3;

  // Followers (25%)
  const followers = engager.followers || 0;
  if (followers >= 10000) score += 25;
  else if (followers >= 5000) score += 20;
  else if (followers >= 1000) score += 15;
  else if (followers >= 200) score += 8;
  else score += 3;

  // Company Size (25%)
  const size = (engager.company_size || '').toLowerCase();
  if (size.includes('10001') || size.includes('10,001')) score += 25;
  else if (size.includes('5001') || size.includes('1001')) score += 20;
  else if (size.includes('501') || size.includes('201')) score += 15;
  else if (size.includes('51') || size.includes('11')) score += 10;
  else if (size.includes('2-10') || size.includes('1-')) score += 5;

  // Seniority (25%) - from headline
  const headline = (engager.headline || '').toLowerCase();
  const cLevel = ['ceo', 'cto', 'cfo', 'coo', 'cmo', 'founder', 'co-founder', 'president', 'owner'];
  const vpLevel = ['vp', 'vice president', 'director', 'head of', 'partner'];
  const mgrLevel = ['manager', 'lead', 'senior', 'principal'];

  if (cLevel.some(t => headline.includes(t))) score += 25;
  else if (vpLevel.some(t => headline.includes(t))) score += 20;
  else if (mgrLevel.some(t => headline.includes(t))) score += 12;
  else score += 5;

  score = Math.min(100, Math.max(0, score));
  const lead_status = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';

  return { lead_score: score, lead_status };
}

module.exports = { computeLeadScore };
