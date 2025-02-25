@minLength(3)
@maxLength(10)
param env string

param location string = resourceGroup().location

resource staticWebApp 'Microsoft.Web/staticSites@2024-04-01' = {
  name: '${env}-penguin-jump-static'
  location: location
  sku: {
    name: 'Free'
  }
  properties: { }
}
