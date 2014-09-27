import django.contrib.gis.forms as forms

class QueryForm(forms.Form):
    disease = forms.CharField(max_length=128)
    gender = forms.CharField(required=False, max_length=2,
                             widget=forms.Select(choices=(("M","M"),("F","F"))))
    age_range = forms.CharField(required=False, max_length=128)
    location = forms.GeometryField(required=False, srid=4326)