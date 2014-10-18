import django.contrib.gis.forms as forms
from django.core.validators import RegexValidator

class QueryForm(forms.Form):
    disease = forms.CharField(max_length=128)
    gender = forms.CharField(required=False, max_length=2,
            validators=[RegexValidator(regex=r"^[MFmf]$")])
    age_range = forms.CharField(required=False, max_length=128, 
            validators=[RegexValidator(regex=r"^\s*[0-9]+\s*-\s*[0-9]+\s*(,\s*[0-9]+\s*-\s*[0-9]+\s*)*$")])
    location = forms.GeometryCollectionField(required=False, srid=4326)
    
    def clean_age_range(self):
        age_range = self.cleaned_data['age_range']
        age_range = age_range.replace(" ","")
        
        return age_range
    
    def clean_gender(self):
        gender = self.cleaned_data['gender']
        gender = gender.upper()
        
        return gender