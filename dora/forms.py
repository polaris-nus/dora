import django.contrib.gis.forms as forms

class QueryForm(forms.Form):
    disease = forms.CharField(max_length=128)
    gender = forms.CharField(null=True, choices=(("M","M"),("F","F")), max_length=2)
    age_range = forms.CharField(null=True, max_length=128)
    location = forms.GeometryField(null=True, srid=4326)