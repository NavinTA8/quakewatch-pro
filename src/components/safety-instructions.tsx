'use client'

import { Shield, AlertTriangle, Home, Car, Building2, Users, Phone, Heart, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const SafetyInstructions = () => {
  return (
    <div className="space-y-6">
      {/* Main DROP, COVER, HOLD ON */}
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
            <Shield className="h-6 w-6" />
            Primary Response: DROP, COVER, HOLD ON
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-3xl font-bold text-orange-600 mb-2">1. DROP</div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Drop to hands and knees immediately. Do not try to run or walk during shaking.
              </p>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-3xl font-bold text-orange-600 mb-2">2. COVER</div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Take cover under a desk or table. If none available, cover head and neck with arms.
              </p>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-3xl font-bold text-orange-600 mb-2">3. HOLD ON</div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Hold onto your shelter and be prepared to move with it. Stay protected until shaking stops.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location-Specific Instructions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              If You're Indoors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Stay inside - do not run outside</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Get under a strong desk or table</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Stay away from windows, mirrors, heavy objects</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">If in bed, stay and cover head with pillow</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Move to doorway only if very close</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              If You're in a Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Pull over safely and stop</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Avoid overpasses, bridges, power lines</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Stay in the vehicle until shaking stops</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Cover head with hands or jacket</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Turn on radio for emergency information</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              If You're Outdoors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Move away from buildings, trees, power lines</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Drop to ground and cover head</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Stay in open areas if possible</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Watch for falling debris</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Do not run into buildings</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              If You're in a Crowd
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Do not rush for exits - avoid stampedes</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Move away from windows and heavy objects</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Take cover where you are</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Help others if safely possible</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Stay calm and follow instructions</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* After the Earthquake */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            After the Earthquake Stops
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Immediate Actions</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Check yourself and others for injuries</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Be prepared for aftershocks</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Check for hazards (gas leaks, electrical damage)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Exit building if structure appears damaged</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Communication</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Use phone only for emergencies</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Listen to radio for official information</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Text messages often work when calls don't</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Contact family to let them know you're safe</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts for Thailand */}
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <Phone className="h-5 w-5" />
            Thailand Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-red-600 mb-2">191</div>
              <div className="text-sm font-medium">Police Emergency</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-red-600 mb-2">199</div>
              <div className="text-sm font-medium">Fire & Rescue</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-red-600 mb-2">1669</div>
              <div className="text-sm font-medium">Medical Emergency</div>
            </div>
          </div>
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Tourist Police:</strong> 1155 • 
              <strong>Bangkok Emergency:</strong> 02-123-4567 • 
              <strong>Disaster Prevention:</strong> 02-123-4568
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Preparation Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Earthquake Preparedness for Thailand
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Emergency Kit Essentials</h4>
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <div>• Water (1 gallon per person for 3 days)</div>
                <div>• Non-perishable food (3-day supply)</div>
                <div>• Battery-powered radio</div>
                <div>• Flashlight and extra batteries</div>
                <div>• First aid kit</div>
                <div>• Whistle for signaling help</div>
                <div>• Dust masks and plastic sheeting</div>
                <div>• Moist towelettes and garbage bags</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Important Documents</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Keep copies of passport, visa, insurance papers, bank records, and emergency contact information 
                in a waterproof container. Store digital copies in cloud storage.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Home Safety</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Secure heavy furniture to walls, know how to turn off gas/electricity, identify safe spots in each room, 
                and practice DROP-COVER-HOLD ON with family members.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}