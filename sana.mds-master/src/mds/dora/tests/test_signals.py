"""This tests the correctness of the signals and
of the integrity of the dora models
"""

from django.test import TestCase
from mds.dora.models import EncounterLocation
from mds.core.models import *
from django.contrib.auth.models import User
from datetime import datetime
from django.contrib.gis.geos import GEOSGeometry

class SignalsTestCase(TestCase):
    def setUp(self):
        
        #create encounters first
        procedure = Procedure.objects.create(title="Test procedure",
                                 author="test",
                                 description="a test procedure")
        user = User.objects.create_user('test', 'test@test.com', 'test')
        observer = Observer.objects.create(user=user)
        device = Device.objects.create(name="test device")
        location = Location.objects.create(name='test location')
        subject = Subject.objects.create(family_name="test",
                                         given_name="test",
                                         dob=datetime.now(),
                                         gender="M",
                                         location=location)
        concept = Concept.objects.create(name="LOCATION GPS",
                                         description="GPS coordinates of patient home.")
        encounter1 = Encounter.objects.create(procedure=procedure,
                                              observer=observer,
                                              device=device,
                                              subject=subject,
                                              concept=concept)
        encounter2 = Encounter.objects.create(procedure=procedure,
                                              observer=observer,
                                              device=device,
                                              subject=subject,
                                              concept=concept)
        
        #create the observations
        Observation.objects.create(encounter=encounter1,
                                        node='test',
                                        concept=concept,
                                        value_text="( 19, -72, 15.0 )")
        
        Observation.objects.create(encounter=encounter2,
                                    node='test2',
                                    concept=concept,
                                    value_text="( 19.2, -72.2, 15.0 )")
        
        Observation.objects.create(encounter=encounter2,
                                    node='test3',
                                    concept=concept,
                                    value_text="( 0.0, 0.0, 0.0 )")

    
    def test_signals_create(self):
        """creating an observation in setUp with gps coordinates should have created a new entry in EncounterLocation"""
        encounter_locations = EncounterLocation.objects.all()
        self.assertTrue(len(encounter_locations) == 2)
        self.assertTrue(encounter_locations[0].coordinates.equals_exact(GEOSGeometry("POINT (19 -72)"), 0.001))
        
        self.assertTrue(encounter_locations[1].coordinates.equals_exact(GEOSGeometry("POINT (19.2 -72.2)"), 0.001))
        
    def test_signals_modify(self):
        """modifying an observation will update the corresponding EncounterLocation correctly"""
        
        #changing gps value will change the gps of the EncounterLocation
        observation = EncounterLocation.objects.all()[0].observation
        observation.value_text = "( 20.1, -11.2, 15.0 )"
        observation.save()
        encounter_locations = EncounterLocation.objects.all()
        self.assertTrue(encounter_locations[1].coordinates.equals_exact(GEOSGeometry("POINT (20.1 -11.2)"), 0.001))
        
        #changing the concept of the observation so that it is not LOCATION GPS anymore will remove the EncounterLocation
        observation = EncounterLocation.objects.all()[0].observation
        concept = Concept.objects.create(name="OTHER CONCEPT",description="Not location GPS anymore")
        observation.concept = concept
        observation.save()
        encounter_locations = EncounterLocation.objects.all()
        self.assertTrue(len(encounter_locations) == 1)
        self.assertTrue(encounter_locations[0].coordinates.equals_exact(GEOSGeometry("POINT (20.1 -11.2)"), 0.001))
        
    def test_signals_delete(self):
        """deleting either the observation or the encounter should delete the EncounterLocation referencing it"""
        encounter_locations = EncounterLocation.objects.all()
        encounter = encounter_locations[0].encounter
        encounter.delete()
        encounter_locations = EncounterLocation.objects.all()
        self.assertTrue(len(encounter_locations) == 1)
        self.assertTrue(encounter_locations[0].coordinates.equals_exact(GEOSGeometry("POINT (19.2 -72.2)"), 0.001))
        
        observation = encounter_locations[0].observation
        observation.delete()
        encounter_locations = EncounterLocation.objects.all()
        self.assertTrue(len(encounter_locations) == 0)