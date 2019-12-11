import React from "react"
import Layout from "../components/layout"
import SEO from "../components/seo"

class PrivacyAltGTUPage extends React.Component {
    render() {
      const siteTitle = "Политика конфиденциальности"
  
      return (
        <Layout location={this.props.location} title={siteTitle}>
          <SEO
            title="Privacy"
            keywords={[`blog`, `gatsby`, `swift`, `swiftui`]}
          />
          <p>
            Example
          </p>
        </Layout>
      )
    }
  }
  
  export default PrivacyAltGTUPage