import django.contrib.gis.forms as forms
from django.core.validators import RegexValidator

class QueryForm(forms.Form):

    #Text Fields
    diagnosis = forms.CharField(required=False, max_length=256)

    gender = forms.CharField(required=False, max_length=2,
            validators=[RegexValidator(regex=r"^[MFmf]$")])

    age_range = forms.CharField(required=False, max_length=128, 
            validators=[RegexValidator(regex=r"^\s*[0-9]+\s*-\s*[0-9]+\s*(,\s*[0-9]+\s*-\s*[0-9]+\s*)*$")])

    location = forms.GeometryCollectionField(required=False, srid=4326)
    procedure = forms.CharField(required=False, max_length=1024)
    patients_given_name = forms.CharField(required=False, max_length=256)
    patients_family_name = forms.CharField(required=False, max_length=256)
    observers_username = forms.CharField(required=False, max_length=256)
    
    surgical_site_drainage_odor = forms.CharField(required=False, max_length=1024)
    color_of_surgical_site_drainage = forms.CharField(required=False, max_length=1024)
    surgical_site_drainage_viscosity = forms.CharField(required=False, max_length=1024)

    #Booleans
    fever_post_surgical_procedure = forms.CharField(required=False, max_length=10)
    location_at_patients_house = forms.CharField(required=False, max_length=10)
    drainage_at_surgery_site = forms.CharField(required=False, max_length=10)
    surgical_site_pain = forms.CharField(required=False, max_length=10)
    redness_at_surgical_site = forms.CharField(required=False, max_length=10)
    swelling_at_surgical_site = forms.CharField(required=False, max_length=10)
    firmness_at_surgical_site = forms.CharField(required=False, max_length=10)
    spontaneous_opening_at_surgical_site = forms.CharField(required=False, max_length=10)
    infecion_suspected_at_surgical_site = forms.CharField(required=False, max_length=10)

    #Date Fields
    operation_date = forms.DateTimeField(required=False)
    discharge_date = forms.DateTimeField(required=False)
    follow_up_date = forms.DateTimeField(required=False)

    #observers_first_name = forms.TextField(required=False),
    #observers_last_name = forms.TextField(required=False),

    def clean_age_range(self):
        age_range = self.cleaned_data['age_range']
        age_range = age_range.replace(" ","")
        
        return age_range
    
    def clean_gender(self):
        gender = self.cleaned_data['gender']
        gender = gender.upper()
        
        return gender

    def clean_dates(self):
        pass
