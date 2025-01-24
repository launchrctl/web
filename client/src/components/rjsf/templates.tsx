import CustomObjectFieldTemplate from './CustomObjectFieldTemplate'
import {
  DescriptionFieldTemplate as SidebarDescriptionFieldTemplate,
  TitleFieldTemplate as SidebarTitleFieldTemplate,
} from './sidebar'
import { TitleFieldTemplate as WizardTitleFieldTemplate } from './wizard'

export default {
  sidebar: {
    TitleFieldTemplate: SidebarTitleFieldTemplate,
    DescriptionFieldTemplate: SidebarDescriptionFieldTemplate,
  },
  full: {},
  wizard: {
    TitleFieldTemplate: WizardTitleFieldTemplate,
    ObjectFieldTemplate: CustomObjectFieldTemplate,
  },
}
