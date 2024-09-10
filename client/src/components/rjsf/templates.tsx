import {
  TitleFieldTemplate as SidebarTitleFieldTemplate,
  DescriptionFieldTemplate as SidebarDescriptionFieldTemplate,
} from './sidebar'

import {
  TitleFieldTemplate as WizardTitleFieldTemplate
} from './wizard'

import CustomObjectFieldTemplate from "./CustomObjectFieldTemplate"

export default {
  sidebar: {
    TitleFieldTemplate: SidebarTitleFieldTemplate,
    DescriptionFieldTemplate: SidebarDescriptionFieldTemplate,
  },
  full: {},
  wizard: {
    TitleFieldTemplate: WizardTitleFieldTemplate,
    ObjectFieldTemplate: CustomObjectFieldTemplate
  }
}
