'use client'

import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div style={{background:'#0f0f0f', minHeight:'100vh', 
    padding:'40px 20px'}}>
      <div style={{maxWidth:'800px', margin:'0 auto'}}>
        
        {/* Back button */}
        <Link href="/" style={{color:'#00bcd4', 
        textDecoration:'none', fontSize:'14px'}}>
          ← Back to ProposalOS
        </Link>

        {/* Header */}
        <div style={{marginTop:'32px', 
        paddingBottom:'24px', 
        borderBottom:'1px solid #222'}}>
          <h1 style={{color:'white', fontSize:'32px', 
          fontWeight:'700', margin:'0 0 8px 0'}}>
            Privacy Policy
          </h1>
          <p style={{color:'#666', fontSize:'13px', 
          margin:'0 0 12px 0'}}>
            Last updated: May 1, 2026
          </p>
          <p style={{color:'#aaa', fontSize:'15px', 
          lineHeight:'1.7', margin:'0'}}>
            Your privacy is important to us. This policy 
            explains what data we collect, why we collect 
            it, and how we protect it.
          </p>
        </div>

        {/* Section 1 */}
        <div style={{marginTop:'32px', padding:'24px', 
        background:'#111', borderRadius:'12px',
        marginBottom:'16px'}}>
          <h2 style={{color:'#00bcd4', fontSize:'18px', 
          fontWeight:'600', margin:'0 0 16px 0'}}>
            1. Information We Collect
          </h2>
          <p style={{color:'#ccc', fontSize:'14px', 
          lineHeight:'1.8', margin:'0 0 12px 0'}}>
            We collect the following information when 
            you use ProposalOS:
          </p>
          <div style={{color:'#bbb', fontSize:'14px', 
          lineHeight:'1.8'}}>
            <p style={{margin:'0 0 10px 0'}}>
              <strong style={{color:'#ddd'}}>
              Account Information:</strong> When you 
              sign in with Google, we receive your name, 
              email address, and profile photo.
            </p>
            <p style={{margin:'0 0 10px 0'}}>
              <strong style={{color:'#ddd'}}>
              Content You Provide:</strong> Job 
              descriptions you submit and any writing 
              samples you choose to share during setup.
            </p>
            <p style={{margin:'0 0 10px 0'}}>
              <strong style={{color:'#ddd'}}>
              Generated Content:</strong> Proposals 
              created through our service are saved 
              to your account.
            </p>
            <p style={{margin:'0'}}>
              <strong style={{color:'#ddd'}}>
              Usage Information:</strong> Basic usage 
              data such as number of proposals generated, 
              used solely to manage service limits.
            </p>
          </div>
        </div>

        {/* Section 2 */}
        <div style={{padding:'24px', background:'#111', 
        borderRadius:'12px', marginBottom:'16px'}}>
          <h2 style={{color:'#00bcd4', fontSize:'18px', 
          fontWeight:'600', margin:'0 0 16px 0'}}>
            2. How We Use Your Information
          </h2>
          <p style={{color:'#ccc', fontSize:'14px', 
          lineHeight:'1.8', margin:'0 0 12px 0'}}>
            We use your information only to:
          </p>
          <ul style={{color:'#bbb', fontSize:'14px', 
          lineHeight:'2', margin:'0 0 16px 0', 
          paddingLeft:'20px'}}>
            <li>Provide and operate the ProposalOS service</li>
            <li>Personalize AI-generated proposals to 
            match your writing style</li>
            <li>Maintain your proposal history</li>
            <li>Enforce fair usage limits</li>
            <li>Improve the quality of our service</li>
          </ul>
          <p style={{color:'#bbb', fontSize:'14px', 
          lineHeight:'1.8', margin:'0'}}>
            We do not sell, rent, or share your personal 
            information with third parties for marketing 
            or advertising purposes.
          </p>
        </div>

        {/* Section 3 */}
        <div style={{padding:'24px', background:'#111', 
        borderRadius:'12px', marginBottom:'16px'}}>
          <h2 style={{color:'#00bcd4', fontSize:'18px', 
          fontWeight:'600', margin:'0 0 16px 0'}}>
            3. Data Retention
          </h2>
          <p style={{color:'#bbb', fontSize:'14px', 
          lineHeight:'1.8', margin:'0'}}>
            We retain your data for as long as your 
            account is active. You may request deletion 
            of your account and all associated data 
            at any time.
          </p>
        </div>

        {/* Section 4 */}
        <div style={{padding:'24px', background:'#111', 
        borderRadius:'12px', marginBottom:'16px'}}>
          <h2 style={{color:'#00bcd4', fontSize:'18px', 
          fontWeight:'600', margin:'0 0 16px 0'}}>
            4. Data Security
          </h2>
          <p style={{color:'#bbb', fontSize:'14px', 
          lineHeight:'1.8', margin:'0'}}>
            We implement industry-standard security 
            measures to protect your personal information 
            against unauthorized access, alteration, 
            disclosure, or destruction. All data is 
            encrypted in transit and at rest.
          </p>
        </div>

        {/* Section 5 */}
        <div style={{padding:'24px', background:'#111', 
        borderRadius:'12px', marginBottom:'16px'}}>
          <h2 style={{color:'#00bcd4', fontSize:'18px', 
          fontWeight:'600', margin:'0 0 16px 0'}}>
            5. Your Rights
          </h2>
          <p style={{color:'#ccc', fontSize:'14px', 
          lineHeight:'1.8', margin:'0 0 12px 0'}}>
            You have the right to:
          </p>
          <ul style={{color:'#bbb', fontSize:'14px', 
          lineHeight:'2', margin:'0', 
          paddingLeft:'20px'}}>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Withdraw consent at any time by 
            discontinuing use of the service</li>
          </ul>
        </div>

        {/* Section 6 */}
        <div style={{padding:'24px', background:'#111', 
        borderRadius:'12px', marginBottom:'16px'}}>
          <h2 style={{color:'#00bcd4', fontSize:'18px', 
          fontWeight:'600', margin:'0 0 16px 0'}}>
            6. Children&apos;s Privacy
          </h2>
          <p style={{color:'#bbb', fontSize:'14px', 
          lineHeight:'1.8', margin:'0'}}>
            ProposalOS is not intended for users under 
            the age of 13. We do not knowingly collect 
            personal information from children.
          </p>
        </div>

        {/* Section 7 */}
        <div style={{padding:'24px', background:'#111', 
        borderRadius:'12px', marginBottom:'16px'}}>
          <h2 style={{color:'#00bcd4', fontSize:'18px', 
          fontWeight:'600', margin:'0 0 16px 0'}}>
            7. Changes to This Policy
          </h2>
          <p style={{color:'#bbb', fontSize:'14px', 
          lineHeight:'1.8', margin:'0'}}>
            We may update this privacy policy from time 
            to time. We will notify you of significant 
            changes by updating the date at the top 
            of this page.
          </p>
        </div>

        {/* Section 8 */}
        <div style={{padding:'24px', background:'#111', 
        borderRadius:'12px', marginBottom:'32px'}}>
          <h2 style={{color:'#00bcd4', fontSize:'18px', 
          fontWeight:'600', margin:'0 0 16px 0'}}>
            8. Contact Us
          </h2>
          <p style={{color:'#bbb', fontSize:'14px', 
          lineHeight:'1.8', margin:'0 0 16px 0'}}>
            If you have questions about this privacy 
            policy or your personal data, please 
            contact our support team.
          </p>
          <button
            disabled
            style={{background:'#333', color:'#666', 
            border:'none', padding:'10px 20px', 
            borderRadius:'8px', fontSize:'13px',
            cursor:'not-allowed'}}>
            Contact Support — Coming Soon
          </button>
        </div>

        {/* Footer */}
        <div style={{textAlign:'center', 
        paddingTop:'24px', 
        borderTop:'1px solid #222',
        paddingBottom:'40px'}}>
          <p style={{color:'#444', fontSize:'13px', 
          margin:'0 0 12px 0'}}>
            © 2026 ProposalOS. All rights reserved.
          </p>
          <Link href="/" style={{color:'#00bcd4', 
          textDecoration:'none', fontSize:'13px'}}>
            ← Back to ProposalOS
          </Link>
        </div>

      </div>
    </div>
  )
}
