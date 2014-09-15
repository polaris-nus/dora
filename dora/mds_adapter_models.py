from django.contrib.gis.db import models
from datetime import datetime

class LastSynchronised(models.Model):

    last_synchronised = models.DateTimeField(default=datetime.min)
    
    def __unicode__(self):
        return self.last_synchronised.isoformat(' ')
    
class PatientLookupTable(models.Model):
    uuid = models.CharField(max_length=128, primary_key=True)
    patient = models.ForeignKey('Patient')

class EncounterLookupTable(models.Model):
    uuid = models.CharField(max_length=128, primary_key=True)
    encounter = models.ForeignKey('Encounter')