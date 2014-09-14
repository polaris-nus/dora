from django.contrib.gis.db import models
from datetime import date

class LastSynchronised(models.Model):

    last_synchronised = models.DateTimeField(default=date.min)
    
    def __unicode__():
        return last_synchronised
    
class PatientLookupTable(models.Model):
    uuid = models.CharField(max_length=128, primary_key=True)
    subject = models.ForeignKey('Patient')
    
class DiseaseLookupTable(models.Model):
    uuid = models.CharField(max_length=128, primary_key=True)
    disease = models.ForeignKey('Disease')